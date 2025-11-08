// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { RedisService } from '../redis/redis.service';
// import { InventoryRepository } from '../repositories/inventory.repository';
// import { RedisLockService } from '../redis/redis-lock.service';

// @Injectable()
// export class OrderCreatedSubscriber implements OnModuleInit {
//   private readonly logger = new Logger(OrderCreatedSubscriber.name);

//   constructor(
//     private readonly redis: RedisService,
//     private readonly repo: InventoryRepository,
//     private readonly lock: RedisLockService,
//   ) {}

//   async onModuleInit() {
//     const client = this.redis.getSubscriber();

//     /** ✅ Correct way to subscribe */
//     await client.subscribe('order.created');

//     /** ✅ Correct way to listen for messages */
//     client.on('message', async (channel, message) => {
//       if (channel !== 'order.created') return;

//       try {
//         const event = JSON.parse(message);
//         await this.handle(event);
//       } catch (err) {
//         this.logger.error(`❌ Failed to parse message: ${message}`);
//       }
//     });

//     this.logger.log('✅ Subscribed to order.created');
//   }

//   private async handle(event: any) {
//     try {
//       const { orderId, items } = event;

//       for (const item of items) {
//         const { sku, quantity } = item;

//         await this.lock.withLock(`inventory:${sku}`, async () => {
//           const inv = await this.repo.findBySku(sku);

//           if (!inv) {
//             this.logger.warn(`⚠ Inventory item not found for SKU ${sku}`);
//             return;
//           }

//           if (inv.stock - inv.reserved < quantity) {
//             this.logger.warn(`⚠ Insufficient stock for SKU ${sku}`);
//             return;
//           }

//           inv.reserved += quantity;

//           await this.repo.update(inv);
//         });
//       }

//       this.logger.log(`✅ Reserved stock for order ${orderId}`);
//     } catch (err: any) {
//       this.logger.error(`❌ Error in subscriber: ${err?.message || err}`);
//     }
//   }
// }
