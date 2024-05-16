//FournisseurProducer.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
 
const sendFournisseurMessage = async (eventType, fournisseurData) => {
  try {
    await producer.connect();
    await producer.send({
      topic: 'fournisseur-events', // Remplacer 'client-events' par 'fournisseur-events'
      messages: [
        { value: JSON.stringify({ eventType, fournisseurData }) }
      ],
    });
    console.log('Message Kafka envoyé avec succès pour l\'événement:', eventType);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message Kafka:', error);
  } finally {
    await producer.disconnect();
  }
};

module.exports = {
  sendFournisseurMessage,
};
