const { Kafka } = require('kafkajs'); // Importer le module Kafka

// Configuration du client Kafka
const kafka = new Kafka({
  clientId: 'fournisseur-consumer', // Identifiant du client Kafka
  brokers: ['localhost:9092'], // Liste des brokers Kafka
});

// Création du consommateur Kafka
const consumer = kafka.consumer({ groupId: 'fournisseur-group' }); // Groupe de consommateurs

// Fonction pour exécuter le consommateur Kafka
const run = async () => {
  try {
    await consumer.connect(); // Connexion au broker Kafka
    await consumer.subscribe({ topic: 'fournisseur-events', fromBeginning: true }); // S'abonner au topic des événements de fournisseur
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString()); // Convertir le message en JSON
        console.log('Received fournisseur event:', event); // Afficher le message reçu

        // Traiter l'événement de fournisseur en fonction du type d'événement
        switch (event.eventType) {
          case 'creation':
            handleFournisseurCreation(event.fournisseurData); // Gérer la création de fournisseur
            break;
          case 'modification':
            handleFournisseurModification(event.fournisseurData); // Gérer la modification de fournisseur
            break;
          case 'suppression':
            handleFournisseurSuppression(event.fournisseurData); // Gérer la suppression de fournisseur
            break;
          default:
            console.warn('Event type not recognized:', event.eventType); // Avertir en cas de type inconnu
        }
      },
    });
  } catch (error) {
    console.error('Error with Kafka consumer:', error); // Gérer les erreurs
  }
};

// Logique pour gérer la création de fournisseur
const handleFournisseurCreation = (fournisseurData) => {
  console.log('Handling fournisseur creation event:', fournisseurData);
  // Ajoutez votre logique pour gérer la création de fournisseur ici
};

// Logique pour gérer la modification de fournisseur
const handleFournisseurModification = (fournisseurData) => {
  console.log('Handling fournisseur modification event:', fournisseurData);
  // Ajoutez votre logique pour gérer la modification de fournisseur ici
};

// Logique pour gérer la suppression de fournisseur
const handleFournisseurSuppression = (fournisseurData) => {
  console.log('Handling fournisseur suppression event:', fournisseurData);
  // Ajoutez votre logique pour gérer la suppression de fournisseur ici
};

// Exécuter le consommateur Kafka
run().catch(console.error); // Gérer les erreurs globales