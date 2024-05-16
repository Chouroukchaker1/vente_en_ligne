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

  Mutation: {
    createFournisseur: async (_, { nom, description }) => {
      try {
        const nouveauFournisseur = new Fournisseur({ nom, description });
        const fournisseur = await nouveauFournisseur.save(); // Sauvegarder le fournisseur

        // Envoyer un message Kafka pour l'événement de création de fournisseur
        await sendFournisseurMessage('creation', { id: fournisseur._id, nom, description });

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

    updateFournisseur: async (_, { id, nom, description }) => {
      try {
        const fournisseur = await Fournisseur.findByIdAndUpdate(
          id,
          { nom, description },
          { new: true } // Retourner le fournisseur mis à jour
        );

        if (!fournisseur) {
          throw new ApolloError("Fournisseur non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de modification de fournisseur
        await sendFournisseurMessage('modification', { id: fournisseur._id, nom, description });

        return fournisseur; // Fournisseur mis à jour
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du fournisseur: ${error.message}`, "INTERNAL_ERROR");
      }
    },

    createClient: async (_, { nom, description }) => {
      try {
        const nouveauClient = new Client({ nom, description });
        const client = await nouveauClient.save(); // Sauvegarder le client

        // Envoyer un message Kafka pour l'événement de création de client
        await sendClientMessage('creation', { id: client._id, nom, description });

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

    updateClient: async (_, { id, nom, description }) => {
      try {
        const client = await Client.findByIdAndUpdate(
          id,
          { nom, description },
          { new: true } // Retourner le client mis à jour
        );

        if (!client) {
          throw new ApolloError("Client non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de modification de client
        await sendClientMessage('modification', { id: client._id, nom, description });

        return client; // Client mis à jour
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du client: ${error.message}`, "INTERNAL_ERROR");
      }
    },

    createProduit: async (_, { nom, description }) => {
      try {
        const nouveauProduit = new Produit({ nom, description });
        const produit = await nouveauProduit.save(); // Sauvegarder le produit

        // Envoyer un message Kafka pour l'événement de création de produit
        await sendProduitMessage('creation', { id: produit._id, nom, description });

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

    updateProduit: async (_, { id, nom, description }) => {
      try {
        const produit = await Produit.findByIdAndUpdate(
          id,
          { nom, description },
          { new: true } // Retourner le produit mis à jour
        );

        if (!produit) {
          throw new ApolloError("Produit non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de modification de produit
        await sendProduitMessage('modification', { id: produit._id, nom, description });

        return produit; // Produit mis à jour
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
  },
};

module.exports = resolvers;
