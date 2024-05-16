//test.js
const grpc = require('@grpc/grpc-js'); // Pour gRPC
const protoLoader = require('@grpc/proto-loader'); // Pour charger Protobuf

// Chemin vers le fichier Protobuf
const clientProtoPath = './client.proto';


// Charger le Protobuf
const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Charger le service Client du package gRPC
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;

// Adresse du serveur gRPC
const serverAddress = 'localhost:50057';

// Créer un client gRPC
const client = new clientProto.ClientService(serverAddress, grpc.credentials.createInsecure());

// Fonction pour obtenir un client par ID
function getClientById(clientId) {
  const request = { client_id: clientId };

  client.getClient(request, (error, response) => {
    if (error) {
      console.error('Erreur lors de la récupération du client:', error.message);
      return;
    }
    console.log('Client récupéré avec succès:', response.client);
  });
}

// Fonction pour créer un nouveau client
function createClient(nom, email,password) {
  const request = { nom, email ,password};

  client.createClient(request, (error, response) => {
    if (error) {
      console.error('Erreur lors de la création du client:', error.message);
      return;
    }
    console.log('Client créé avec succès:', response.client);
  });
}
// Fonction pour supprimer un client par ID
function deleteClientById(clientId) {
  const request = { client_id: clientId };

  client.deleteClient(request, (error, response) => {
    if (error) {
      console.error('Erreur lors de la suppression du client:', error.message);
      return;
    }
    console.log('Client supprimé avec succès.');
  });
}

// Fonction pour mettre à jour un client par ID
function updateClient(clientId, nom, email,password) {
  const request = { client_id: clientId, nom, email ,password};

  client.updateClient(request, (error, response) => {
    if (error) {
      console.error('Erreur lors de la mise à jour du client:', error.message);
      return;
    }
    console.log('Client mis à jour avec succès:', response.client);
  });
}
// Appel de la fonction pour supprimer un client par ID
//const clientIdToDelete = '664537efa981e6672a7af4cd';
//deleteClientById(clientIdToDelete);


// Exemple d'utilisation
//const clientIdToFetch = '664537efa981e6672a7af4cd';
const newClientName = 'Nouveau Client';
const newClientEmail = 'email du nouveau client';
const newClientPassword = 'password du nouveau client';
// Appel de la fonction pour créer un nouveau client
createClient(newClientName, newClientEmail,newClientPassword);


// Appel de la fonction pour obtenir un client par ID
//getClientById(clientIdToFetch);



//const clientIdToFetch = '664537efa981e6672a7af4cd';
//const newClientName = 'Nouveau Client';
//const newClientEmail = 'Email du nouveau client';
//const newClientPassword = 'password du nouveau client';
//updateClient(clientIdToFetch, newClientName, newClientEmail,newClientPassword);