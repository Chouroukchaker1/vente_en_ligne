const { gql } = require('@apollo/server');

const typeDefs = `#graphql
    type Fournisseur {
        id: String!
        nom: String!
        contact: String!
        adresse: String!
    }

    type Produit {
        id: String!
        nom: String!
        description: String!
        qualite: String!
    }
  
    type Client {
        id: String!
        nom: String!
        email: String!
        password: String! # Inclure le champ password
    }

    type Query {
        fournisseur(id: String!): Fournisseur
        fournisseurs: [Fournisseur]
        produit(id: String!): Produit
        produits: [Produit]
        client(id: String!): Client
        clients: [Client]
    }

    type Mutation {
        createFournisseur(nom: String!, contact: String!, adresse: String!): Fournisseur
        deleteFournisseur(id: String!): String
        updateFournisseur(id: String!, nom: String!, contact: String!, adresse: String!): Fournisseur

        createProduit(nom: String!, description: String!, qualite: String!): Produit
        deleteProduit(id: String!): String
        updateProduit(id: String!, nom: String!, description: String!, qualite: String!): Produit

        createClient(nom: String!, email: String!, password: String!): Client
        deleteClient(id: String!): String
        updateClient(id: String!, nom: String!, email: String!, password: String!): Client
    }
`;

module.exports = typeDefs;
