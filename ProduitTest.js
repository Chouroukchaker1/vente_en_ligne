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

function createProduit(nom, description, qualite) {
  const request = { nom, description, qualite};  

  client.createProduit(request, (error, response) => {
      if (error) {
          console.error('Erreur lors de la création du produit:', error.message);
          return;
      }
      console.log('Produit créé avec succès:', response.produit);
  });
}


function updateProduit(id, nom, description,qualite) {
    const request = { id, nom, description ,qualite};
  
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
const newProduitQualite = 'Qualite du nouveau produit';
createProduit(newProduitName, newProduitDescription,newProduitQualite);

// Appel de la fonction pour supprimer un client par ID
// const IdToDelete = '664534740cc1e844a84a444f';
// deleteProduit(IdToDelete);

// Exemple d'utilisation
 //const produitIdToFetch = '6645bb8f29fcbd90df3f8b44';

// Appel de la fonction pour créer un nouveau client

// Appel de la fonction pour obtenir un client par ID
// getClientById(clientIdToFetch);

//const produitIdToFetch = '6645bb8f29fcbd90df3f8b44';
//const updateProduitName = 'Produit mis à jour';
//const updatedProduitDescription = 'Description mise à jour';
//const updatedProduitQualite = 'Qualite mise à jour';

 

//updateProduit(produitIdToFetch, updateProduitName, updatedProduitDescription,updatedProduitQualite);
