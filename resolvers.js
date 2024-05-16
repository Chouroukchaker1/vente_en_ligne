//resolver.js 
const { ApolloError } = require('apollo-server');
const Fournisseur = require('./fournisseur');
const Produit = require('./produit');
const Client = require('./client');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendProduitMessage } = require('./ProduitProducer'); // Importer la fonction d'envoi de message Kafka
const { sendClientMessage } = require('./clientProducer'); // Importer la fonction d'envoi de message Kafka pour les clients
const { sendFournisseurMessage } = require('./FournisseurProducer');



// Charger les fichiers Protobuf
const fournisseurProtoPath = './fournisseur.proto';
const produitProtoPath = './produit.proto';
const clientProtoPath = './client.proto';

// Charger les définitions Protobuf
const fournisseurProtoDefinition = protoLoader.loadSync(fournisseurProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const produitProtoDefinition = protoLoader.loadSync(produitProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Obtenir les services gRPC
const fournisseurProto = grpc.loadPackageDefinition(fournisseurProtoDefinition).fournisseur;
const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;

const clientFournisseur = new fournisseurProto.FournisseurService(
  'localhost:50053',
  grpc.credentials.createInsecure()
);

const clientProduit = new produitProto.ProduitService(
  'localhost:50054',
  grpc.credentials.createInsecure()
);

const clientClient = new clientProto.ClientService(
  'localhost:50055',
  grpc.credentials.createInsecure()
);

const resolvers = {
  Query: {
    fournisseur: async (_, { id }) => {
      try {
        return await Fournisseur.findById(id); // Trouver le fournisseur par ID
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche du fournisseur: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    fournisseurs: async () => {
      try {
        return await Fournisseur.find(); // Trouver tous les fournisseurs
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche des fournisseurs: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    produit: async (_, { id }) => {
      try {
        return await Produit.findById(id); // Trouver le produit par ID
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    produits: async () => {
      try {
        return await Produit.find(); // Trouver tous les produits
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche des produits: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    client: async (_, { id }) => {
      try {
        return await Client.findById(id); // Trouver le client par ID
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche du client: ${error.message}`, "INTERNAL_ERROR");
      }
    },
  
    clients: async () => {
      try {
        return await Client.find(); // Trouver tous les clients
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche des clients: ${error.message}`, "INTERNAL_ERROR");
      }
    },
  },
  Mutation: {
    createFournisseur: async (_, { nom, contact,adresse}) => {
      try {
        const nouveauFournisseur = new Fournisseur({ nom, contact,adresse});
        const fournisseur = await nouveauFournisseur.save(); // Sauvegarder le fournisseur
        
        // Envoyer un message Kafka pour l'événement de création de fournisseur
        await sendFournisseurMessage('creation', { id: fournisseur._id, nom, contact,adresse });


        return fournisseur; // Retourner le fournisseur créé
      } catch (error) {
        throw new ApolloError(`Erreur lors de la création du fournisseur: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    deleteFournisseur: async (_, { id }) => {
      try {
        const fournisseur = await Fournisseur.findByIdAndDelete(id); // Supprimer par ID
        if (!fournisseur) {
          throw new ApolloError("Fournisseur non trouvé", "NOT_FOUND");
        }
    
        // Envoyer un message Kafka pour l'événement de suppression de fournisseur
        await sendFournisseurMessage('suppression', { id });
    
        return "Fournisseur supprimé avec succès";
      } catch (error) {
        throw new ApolloError(`Erreur lors de la suppression du fournisseur: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    updateFournisseur: async (_, { id, nom, contact,adresse}) => {
      try {
        const fournisseur = await Fournisseur.findByIdAndUpdate(
          id,
          { nom, contact,adresse },
          { new: true } // Retourner le fournisseur mis à jour
        );
        
        if (!fournisseur) {
          throw new ApolloError("Fournisseur non trouvé", "NOT_FOUND");
        }
    
        // Envoyer un message Kafka pour l'événement de modification de fournisseur
        await sendFournisseurMessage('modification', { id: fournisseur._id,contact,adresse });
    
        return fournisseur; // Fournisseur mis à jour
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du fournisseur: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    createClient: async (_, { nom, email,password }) => {
      try {
        const nouveauClient = new Client({ nom, email,password });
        const client = await nouveauClient.save(); // Sauvegarder le client
        
        // Envoyer un message Kafka pour l'événement de création de client
        await sendClientMessage('creation', { id: client._id, nom, email,password });
  
        return client; // Retourner le client créé
      } catch (error) {
        throw new ApolloError(`Erreur lors de la création du client: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    deleteClient: async (_, { id }) => {
      try {
        const client = await Client.findByIdAndDelete(id); // Supprimer par ID
        if (!client) {
          throw new ApolloError("Client non trouvé", "NOT_FOUND");
        }
    
        // Envoyer un message Kafka pour l'événement de suppression de client
        await sendClientMessage('suppression', { id });
    
        return "Client supprimé avec succès";
      } catch (error) {
        throw new ApolloError(`Erreur lors de la suppression du client: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    updateClient: async (_, { id, nom, email ,password}) => {
      try {
        const client = await Client.findByIdAndUpdate(
          id,
          { nom, email,password},
          { new: true } // Retourner le client mis à jour
        );
        
        if (!client) {
          throw new ApolloError("Client non trouvé", "NOT_FOUND");
        }
    
        // Envoyer un message Kafka pour l'événement de modification de client
        await sendClientMessage('modification', { id: client._id, nom, email,password });
    
        return client; // Client mis à jour
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du client: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    createProduit: async (_, { nom, description, prix }) => {
      try {
        const nouveauProduit = new Produit({ nom, description, prix });
        const produit = await nouveauProduit.save(); // Sauvegarder le produit
        
        // Envoyer un message Kafka pour l'événement de création de produit
        await sendProduitMessage('creation', { id: produit._id, nom, description, prix });
    
        return produit; // Retourner le produit créé
      } catch (error) {
        throw new ApolloError(`Erreur lors de la création du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    deleteProduit: async (_, { id }) => {
      try {
        const produit = await Produit.findByIdAndDelete(id); // Supprimer par ID
        if (!produit) {
          throw new ApolloError("Produit non trouvé", "NOT_FOUND");
        }
    
        // Envoyer un message Kafka pour l'événement de suppression de produit
        await sendProduitMessage('suppression', { id });
    
        return "Produit supprimé avec succès";
      } catch (error) {
        throw new ApolloError(`Erreur lors de la suppression du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    updateProduit: async (_, { id, nom, description ,prix}) => {
      try {
        const produit = await Produit.findByIdAndUpdate(
          id,
          { nom, description,prix },
          { new: true } // Retourner le produit mis à jour
        );
        
        if (!produit) {
          throw new ApolloError("Produit non trouvé", "NOT_FOUND");
        }
    
        // Envoyer un message Kafka pour l'événement de modification de produit
        await sendProduitMessage('modification', { id: produit._id, nom, description ,prix});
    
        return produit; // Produit mis à jour
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
  },
};


module.exports = resolvers;
