
// import { Injectable } from '@nestjs/common';
// import { KafkaConsumerService } from './kafka.consumer';
// import { RealtimeGateway } from '../websocket.gateway';

// @Injectable()
// export class OrderEventsConsumer {
//   constructor(
//     private readonly gateway: RealtimeGateway,
//     private readonly consumer: KafkaConsumerService,
//   ) {}

//   async onModuleInit() {
//     await this.consumer.subscribe('order.updated', async (payload) => {
//       this.gateway.sendOrderUpdate(payload.buyerId, payload);
//     });

//     await this.consumer.subscribe('order.created', async (payload) => {
//       this.gateway.sendOrderUpdate(payload.buyerId, payload);
//     });
//   }
// }
// // Example Frontend Client (React)
// // const socket = io("https://realtime.myapp.com", {
// //   query: { userId: localStorage.getItem("userId") }
// // });

// // socket.on("order.update", (data) => {
// //   console.log("Order Updated:", data);
// // });