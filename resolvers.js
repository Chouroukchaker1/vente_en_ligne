const { ApolloError } = require('apollo-server');
const Fournisseur = require('./fournisseur');
const Produit = require('./produit');
const Client = require('./client');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendProduitMessage } = require('./ProduitProducer');
const { sendClientMessage } = require('./clientProducer');
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

// Définir les clients gRPC
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
      return new Promise((resolve, reject) => {
        clientFournisseur.getFournisseur({ fournisseur_id: id }, (error, response) => {
          if (error) {
            reject(new ApolloError(`Erreur lors de la recherche du fournisseur: ${error.message}`, "INTERNAL_ERROR"));
          } else {
            resolve(response.fournisseur);
          }
        });
      });
    },
    
    fournisseurs: async () => {
      return new Promise((resolve, reject) => {
        clientFournisseur.getFournisseurs({}, (error, response) => {
          if (error) {
            reject(new ApolloError(`Erreur lors de la recherche des fournisseurs: ${error.message}`, "INTERNAL_ERROR"));
          } else {
            resolve(response.fournisseurs);
          }
        });
      });
    },

    produit: async (_, { id }) => {
      return new Promise((resolve, reject) => {
        clientProduit.getProduit({ produit_id: id }, (error, response) => {
          if (error) {
            reject(new ApolloError(`Erreur lors de la recherche du produit: ${error.message}`, "INTERNAL_ERROR"));
          } else {
            resolve(response.produit);
          }
        });
      });
    },

    client: async (_, { id }) => {
      return new Promise((resolve, reject) => {
        clientClient.getClient({ client_id: id }, (error, response) => {
          if (error) {
            reject(new ApolloError(`Erreur lors de la recherche du client: ${error.message}`, "INTERNAL_ERROR"));
          } else {
            resolve(response.client);
          }
        });
      });
    },

    clients: async () => {
      return new Promise((resolve, reject) => {
        clientClient.getClients({}, (error, response) => {
          if (error) {
            reject(new ApolloError(`Erreur lors de la recherche des clients: ${error.message}`, "INTERNAL_ERROR"));
          } else {
            resolve(response.clients);
          }
        });
      });
    },
  },

  Mutation: {
    createFournisseur: async (_, { nom, contact, adresse }) => {
      return new Promise((resolve, reject) => {
      clientFournisseur.createFournisseur({ nom, contact, adresse }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la création du fournisseur: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const fournisseur = response.fournisseur;
      await sendFournisseurMessage('creation', { id: fournisseur.id, nom, contact, adresse });
      resolve(fournisseur);
      }
      });
      });
      },
      deleteFournisseur: async (_, { id }) => {
      return new Promise((resolve, reject) => {
      clientFournisseur.deleteFournisseur({ fournisseur_id: id }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la suppression du fournisseur: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      if (response.message !== "Fournisseur supprimé avec succès") {
      reject(new ApolloError("Fournisseur non trouvé", "NOT_FOUND"));
      } else {
      await sendFournisseurMessage('suppression', { id });
      resolve(response.message);
      }
      }
      });
      });
      },
      updateFournisseur: async (_, { id, nom, contact, adresse }) => {
      return new Promise((resolve, reject) => {
      clientFournisseur.updateFournisseur({ fournisseur_id: id, nom, contact, adresse }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la mise à jour du fournisseur: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const fournisseur = response.fournisseur;
      await sendFournisseurMessage('modification', { id: fournisseur.id, nom, contact, adresse });
      resolve(fournisseur);
      }
      });
      });
      },
      createProduit: async (_, { nom, description, qualite }) => {
      return new Promise((resolve, reject) => {
      clientProduit.createProduit({ nom, description, qualite }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la création du produit: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const produit = response.produit;
      await sendProduitMessage('creation', { id: produit.id, nom, description, qualite });
      resolve(produit);
      }
      });
      });
      },
      deleteProduit: async (_, { id }) => {
      return new Promise((resolve, reject) => {
      clientProduit.deleteProduit({ produit_id: id }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la suppression du produit: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      if (response.message !== "Produit supprimé avec succès") {
      reject(new ApolloError("Produit non trouvé", "NOT_FOUND"));
      } else {
      await sendProduitMessage('suppression', { id });
      resolve(response.message);
      }
      }
      });
      });
      },
      updateProduit: async (_, { id, nom, description, qualite }) => {
      return new Promise((resolve, reject) => {
      clientProduit.updateProduit({ produit_id: id, nom, description, qualite }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la mise à jour du produit: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const produit = response.produit;
      await sendProduitMessage('modification', { id: produit.id, nom, description, qualite });
      resolve(produit);
      }
      });
      });
      },
      createClient: async (_, { nom, email, password }) => {
      return new Promise((resolve, reject) => {
      clientClient.createClient({ nom, email, password }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la création du client: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const client = response.client;
      await sendClientMessage('creation', { id: client.id, nom, email, password });
      resolve(client);
      }
      });
      });
      },
      deleteClient: async (_, { id }) => {
      return new Promise((resolve, reject) => {
      clientClient.deleteClient({ client_id: id }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la suppression du client: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      if (response.message !== "Client supprimé avec succès") {
      reject(new ApolloError("Client non trouvé", "NOT_FOUND"));
      } else {
      await sendClientMessage('suppression', { id });
      resolve(response.message);
      }
      }
      });
      });
      },
      updateClient: async (_, { id, nom, email, password }) => {
      return new Promise((resolve, reject) => {
      clientClient.updateClient({ client_id: id, nom, email, password }, async (error, response) => {
      if (error) {
      reject(new ApolloError(`Erreur lors de la mise à jour du client: ${error.message}`, "INTERNAL_ERROR"));
      } else {
      const client = response.client;
      await sendClientMessage('modification', { id: client.id, nom, email, password });
      resolve(client);
      }
      });
      });
      },
      },
      };
      
module.exports = resolvers;
