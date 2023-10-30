const amqp = require('amqplib/callback_api');
const { json } = require('body-parser');

let connection = null;
let channel = null;

// Function to establish the connection and create a channel
function createConnectionAndChannel() {
    amqp.connect('amqp://localhost', (error, conn) => {
        if (error) {
            console.error('Error creating connection:', error);
            return;
        }

        connection = conn;

        connection.createChannel((channelError, ch) => {
            if (channelError) {
                console.error('Error creating channel:', channelError);
                return;
            }

            channel = ch;
            console.log('Connection and channel established');
        });
    });
}

createConnectionAndChannel();


const publishToQueue = (queueName, message) => {
    channel.assertQueue(queueName, {
        durable: true
    });
    
    channel.sendToQueue(queueName, Buffer.from(message), {
        persistent: true
    });
    console.log(" [x] Sent '%s'", message);
}


// const getFromQueue = (queueName) => {

//     // This makes sure the queue is declared before attempting to consume from it
//     channel.assertQueue(queueName, {
//         durable: true
//     });

//     channel.consume(queueName, (msg) => {
//         // console.log(" [x] Received %s", msg.content.toString());
//         msgContent = msg.content.toString();
//         console.log(" [x] Received %s", msgContent);
//     }, {
//         noAck: false
//     });

// }

const getFromQueue = (queueName) => {
    return new Promise((resolve, reject) => {
        // This makes sure the queue is declared before attempting to consume from it
        channel.assertQueue(queueName, {
            durable: true
        });

        const messages = [];

        channel.consume(queueName, (msg) => {
            if (msg) {
                const msgContent = JSON.parse(msg.content.toString()); // Assuming message is JSON
                msgContent.deliveryTag = msg.fields.deliveryTag; // Add the deliveryTag to the message object
                messages.push(msgContent);

                console.log(" [x] Received %s", JSON.stringify(msgContent));
                resolve(messages); // Resolve the Promise with msgContent
                channel.close(); // Close the channel
            }
        }, {
            noAck: false
        });
    });
}

const sendAck = (deliveryTag) => {
    // Acknowledge the message by providing the delivery tag
    const deliveryTagInt = parseInt(deliveryTag);
    channel.ack({ fields: { deliveryTag: deliveryTagInt } });
    console.log('Acknowledgement sent');
}

// Close the connection when the application exits
process.on('exit', () => {
    if (connection) {
        connection.close();
        console.log('Connection closed');
    }
});


module.exports = {
    publishToQueue,
    getFromQueue,
    sendAck,
    createConnectionAndChannel
}