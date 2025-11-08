// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   OnGatewayInit,
//   OnGatewayConnection,
//   OnGatewayDisconnect
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';

// @WebSocketGateway({
//   cors: { origin: '*' },
// })
// export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
//   @WebSocketServer() server: Server;

//   afterInit() {
//     console.log('✅ WebSocket Gateway Initialized');
//   }

//   handleConnection(client: Socket) {
//     const userId = client.handshake.query.userId;
//     client.join(`user-${userId}`);
//     console.log(`✅ User connected → ${userId}`);
//   }

//   handleDisconnect(client: Socket) {
//     console.log(`❌ User disconnected`);
//   }

//   sendOrderUpdate(userId: string, payload: any) {
//     this.server.to(`user-${userId}`).emit('order.update', payload);
//   }
// }
