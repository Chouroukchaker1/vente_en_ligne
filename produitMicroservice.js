//produitMicroservicejs
const grpc = require('@grpc/grpc-js'); // Pour gRPC
const protoLoader = require('@grpc/proto-loader'); // Pour charger Protobuf
const mongoose = require('mongoose'); // Pour MongoDB
const Produit = require('./produit'); // Modèle Mongoose pour les produits
const { sendProduitMessage } = require('./ProduitProducer');

// Chemin vers le fichier Protobuf
const produitProtoPath = './produit.proto';

// Charger le Protobuf
const produitProtoDefinition = protoLoader.loadSync(produitProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Charger le service Produit du package gRPC
const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/vente') // Utilisez IPv4 pour éviter les problèmes
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1); // Quitte le processus en cas d'erreur
  });

// Implémentation du service gRPC pour les produits
const produitService = {
  getProduit: async (call, callback) => {
    try {
      const produitId = call.request.produit_id;
      const produit = await Produit.findById(produitId);

      if (!produit) {
        return callback(new Error("Produit non trouvé"));
      }

      callback(null, { produit });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche du produit"));
    }
  },

  searchProduits: async (call, callback) => {
    try {
      const produits = await Produit.find();
      callback(null, { produits });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche des produits"));
    }
  },

 
  createProduit: async (call, callback) => {
    try {
      const { nom, description,qualite } = call.request;
      const nouveauProduit = new Produit({ nom, description,qualite });
      const produit = await nouveauProduit.save();
      
      await sendProduitMessage('creation', { id: produit._id, nom, qualite });
  
      callback(null, { produit });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  

  updateProduit: async (call, callback) => {
    try {
        const { produit_id, nom, description, qualite } = call.request; // Change de 'produit_id' à 'id'
        const produit = await Produit.findByIdAndUpdate(
            produit_id,
            { nom, description, qualite },
            { new: true }
        );

        if (!produit) {
            // Si le produit n'est pas trouvé, renvoie un statut NOT_FOUND gRPC
            return callback({ code: grpc.status.NOT_FOUND, message: "Produit non trouvé" });
        }

        // Si le produit est trouvé, envoyer les données du produit mis à jour
        await sendProduitMessage('modification', produit);
        callback(null, { produit });
    } catch (err) {
        console.error("Erreur lors de la mise à jour du produit:", err);
        // Si une autre erreur se produit, renvoie un statut gRPC INTERNAL
        callback({ code: grpc.status.INTERNAL, message: "Erreur lors de la mise à jour du produit: " + err.message });
    }
},




  deleteProduit: async (call, callback) => {
    try {
      const produitId = call.request.produit_id;
      const produit = await Produit.findByIdAndDelete(produitId);

      if (!produit) {
        return callback(new Error("Produit non trouvé"));
      }

      // Envoyer un événement Kafka pour la suppression d'un produit
      await sendProduitMessage('suppression', produit);

      callback(null, { message: "Produit supprimé avec succès" });
    } catch (err) {
      callback(new Error("Erreur lors de la suppression du produit: " + err.message));
    }
  },
};

// Créer le serveur gRPC
const server = new grpc.Server();
server.addService(produitProto.ProduitService.service, produitService);

server.bindAsync('0.0.0.0:50054', grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Échec de la liaison du serveur:", err);
    return;
  }
  server.start();
  console.log(`Service Produit opérationnel sur le port ${boundPort}`);
});
