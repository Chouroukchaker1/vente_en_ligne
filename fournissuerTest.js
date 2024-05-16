//fournisseur.Test.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const fournisseurProtoPath = './fournisseur.proto'; // Chemin vers le fichier Protobuf du service fournisseur
const fournisseurProtoDefinition = protoLoader.loadSync(fournisseurProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const fournisseurProto = grpc.loadPackageDefinition(fournisseurProtoDefinition).fournisseur; // Charger le service fournisseur

const serverAddress = 'localhost:50053'; // Adresse du serveur gRPC pour le service fournisseur

const client = new fournisseurProto.FournisseurService(serverAddress, grpc.credentials.createInsecure()); // Créer un client gRPC pour le service fournisseur

function createFournisseur(nom, contact,adresse) {
    const request = { nom, contact,adresse }; // Créer une demande avec les paramètres nom et conatct
  
    client.createFournisseur(request, (error, response) => { // Appeler la méthode createFournisseur du service fournisseur
      if (error) {
        console.error('Erreur lors de la création du fournisseur:', error.message);
        return;
  
      }
      console.log('Fournisseur créé avec succès:', response.fournisseur); // Afficher le fournisseur créé
    });

}
function updateFournisseur(id, nom, contact,adresse) {
    const request = { id, nom,contact, adresse};
  
    client.updateFournisseur(request, (error, response) => {
      if (error) {
        console.error('Erreur lors de la mise à jour du fournisseur:', error.message);
        return;
      }
      console.log('Fournisseur mis à jour avec succès:', response.fournisseur);
    });
}
function deleteFournisseur(id) {
    const request = { id };
  
    client.deleteFournisseur(request, (error, response) => {
      if (error) {
        console.error('Erreur lors de la suppression du fournisseur:', error.message);
        return;
      }
      console.log(response.message);
    });
}
// Utilisation de la fonction pour créer un nouveau fournisseur
const newFournisseurName = 'Nouveau Fournisseur';
const newFournisseurConatct= 'Conatct du nouveau fournisseur';
const newFournisseurAdresse= 'Adresse du nouveau fournisseur';
createFournisseur(newFournisseurName, newFournisseurConatct, newFournisseurAdresse); // Appel de la fonction pour créer un nouveau fournisseur


//const fournisseurIdToUpdate = '66453fe9ac23c8de9d20ffc5';
//const updatedFournisseurName = 'Fournisseur mis à jour';
//const updatedFournisseurContact = 'Contact mise à jour';
//const updatedFournisseurAdresse = 'Adresse mise à jour';

//updateFournisseur(fournisseurIdToUpdate, updatedFournisseurName, updatedFournisseurContact, updatedFournisseurAdresse);


//const fournisseurIdToDelete = '66453fe9ac23c8de9d20ffc5';

//deleteFournisseur(fournisseurIdToDelete);