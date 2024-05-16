//produitTest.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const produitProtoPath = './produit.proto';
const produitProtoDefinition = protoLoader.loadSync(produitProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;
const serverAddress = 'localhost:50054';

const client = new produitProto.ProduitService(serverAddress, grpc.credentials.createInsecure());

function createProduit(nom, description) {
    const request = { nom, description };
  
    client.createProduit(request, (error, response) => {
      if (error) {
        console.error('Erreur lors de la création du produit:', error.message);
        return;
      }
      console.log('Produit créé avec succès:', response.produit);
    });
}

function updateProduit(id, nom, description) {
    const request = { id, nom, description };
  
    client.updateProduit(request, (error, response) => {
      if (error) {
        console.error('Erreur lors de la mise à jour du produit:', error.message);
        return;
      }
      console.log('Produit mis à jour avec succès:', response.produit);
    });
}

function deleteProduit(id) {
    const request = { id };
  
    client.deleteProduit(request, (error, response) => {
      if (error) {
        console.error('Erreur lors de la suppression du produit:', error.message);
        return;
      }
      console.log('Produit supprimé avec succès:', response.message);
    });
}

// Utilisation de la fonction pour créer un nouveau produit
const newProduitName = 'Nouveau Produit';
const newProduitDescription = 'Description du nouveau produit';
createProduit(newProduitName, newProduitDescription);

// Appel de la fonction pour supprimer un client par ID
// const IdToDelete = '664534740cc1e844a84a444f';
// deleteProduit(IdToDelete);

// Exemple d'utilisation
// const produitIdToFetch = '664534740cc1e844a84a444f';

// Appel de la fonction pour créer un nouveau client

// Appel de la fonction pour obtenir un client par ID
// getClientById(clientIdToFetch);

//const produitIdToUpdate = '664546c4d2d34428daa69b53';
//const updateProduitName = 'Produit mis à jour';
//const updatedProduitDescription = 'Description mise à jour';

//updateProduit(produitIdToUpdate, updateProduitName, updatedProduitDescription);
