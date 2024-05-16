//fournissuermicroservice
const grpc = require('@grpc/grpc-js'); // Pour gRPC
const protoLoader = require('@grpc/proto-loader'); // Pour charger Protobuf
const mongoose = require('mongoose'); // Pour MongoDB
const Fournisseur = require('./fournisseur'); // Modèle Mongoose pour les fournisseurs
const { sendFournisseurMessage } = require('./FournisseurProducer'); // Producteur Kafka pour les fournisseurs

// Chemin vers le fichier Protobuf
const fournisseurProtoPath = './fournisseur.proto';

// Charger le Protobuf
const fournisseurProtoDefinition = protoLoader.loadSync(fournisseurProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,

  defaults: true,
  oneofs: true,
});

// Charger le service Fournisseur du package gRPC
const fournisseurProto = grpc.loadPackageDefinition(fournisseurProtoDefinition).fournisseur;

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/vente') // Utilisez IPv4 pour éviter les problèmes
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1); // Quitte le processus en cas d'erreur
  });

// Implémentation du service gRPC pour les fournisseurs
const fournisseurService = {
  getFournisseur: async (call, callback) => {
    try {
      const fournisseurId = call.request.fournisseur_id;
      const fournisseur = await Fournisseur.findById(fournisseurId);

      if (!fournisseur) {
        return callback(new Error("Fournisseur non trouvé"));
      }

      callback(null, { fournisseur });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche du fournisseur"));
    }
  },

  searchFournisseurs: async (call, callback) => {
    try {
      const fournisseurs = await Fournisseur.find();
      callback(null, { fournisseurs });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche des fournisseurs"));
    }
  },
  createFournisseur: async (call, callback) => {
    try {
      const { nom, contact,adresse } = call.request;
      const nouveauFournisseur = new Fournisseur({ nom, contact,adresse}); // Corrected from 'fournisseur' to 'Fournisseur'
      const fournisseur = await nouveauFournisseur.save();
      
      await sendFournisseurMessage('creation', { id: fournisseur._id, nom, contact,adresse});
  
      callback(null, { fournisseur });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  

  updateFournisseur: async (call, callback) => {
    try {
      const { id, nom, contact,adresse} = call.request; // Update parameter names
      const fournisseur = await Fournisseur.findByIdAndUpdate(
        id,
        { nom, contact,adresse },
        { new: true } // Return the updated fournisseur
      );

      if (!fournisseur) {
        return callback(new Error("Fournisseur non trouvé"));
      }

      // Send a Kafka event for fournisseur update
      await sendFournisseurMessage('modification', fournisseur);

      callback(null, { fournisseur });
    } catch (err) {
      callback(new Error("Erreur lors de la mise à jour du fournisseur: " + err.message));
    }
  },

  deleteFournisseur: async (call, callback) => {
    try {
      const fournisseurId = call.request.id; // Update to match the request parameter name
      console.log("Deleting fournisseur with ID:", fournisseurId);

      const fournisseur = await Fournisseur.findByIdAndDelete(fournisseurId);

      if (!fournisseur) {
        console.log("Fournisseur not found for deletion");
        return callback(new Error("Fournisseur non trouvé"));
      }

      // Envoyer un événement Kafka pour la suppression d'un fournisseur
      await sendFournisseurMessage('suppression', fournisseur);

      console.log("Fournisseur deleted successfully");
      callback(null, { message: "Fournisseur supprimé avec succès" });
    } catch (err) {
      console.error("Error deleting fournisseur:", err);
      callback(new Error("Erreur lors de la suppression du fournisseur: " + err.message));
    }
},

};

// Créer le serveur gRPC
const server = new grpc.Server();
server.addService(fournisseurProto.FournisseurService.service, fournisseurService);

server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Échec de la liaison du serveur:", err);
    return;
  }
  server.start();
  console.log(`Service Fournisseur opérationnel sur le port ${boundPort}`);
});
