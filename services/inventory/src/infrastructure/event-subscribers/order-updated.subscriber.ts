// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { RedisService } from '../redis/redis.service';
// import { InventoryRepository } from '../repositories/inventory.repository';
// import { RedisLockService } from '../redis/redis-lock.service';

// @Injectable()
// export class OrderUpdatedSubscriber implements OnModuleInit {
//   private readonly logger = new Logger(OrderUpdatedSubscriber.name);

//   constructor(
//     private readonly redis: RedisService,
//     private readonly repo: InventoryRepository,
//     private readonly lock: RedisLockService,
//   ) {}

//   async onModuleInit() {
//     const client = this.redis.getSubscriber();

//     /** ✅ Correct ioredis subscription */
//     await client.subscribe('order.updated');

//     /** ✅ ioredis delivers message via .on("message") */
//     client.on('message', async (channel: string, message: string) => {
//       if (channel !== 'order.updated') return;

//       try {
//         const event = JSON.parse(message);
//         await this.handle(event);
//       } catch (err) {
//         this.logger.error(`❌ Failed to parse Redis message: ${message}`);
//       }
//     });

//     this.logger.log('✅ Subscribed to order.updated');
//   }

//   private async handle(event: any) {
//     const { orderId, status, items } = event;

//     try {
//       for (const item of items) {
//         const { sku, quantity } = item;

//         await this.lock.withLock(`inventory:${sku}`, async () => {
//           const inv = await this.repo.findBySku(sku);
//           if (!inv) return;

//           /** ✅ Order Cancelled → Release reserved stock */
//           if (status === 'cancelled') {
//             inv.reserved = Math.max(inv.reserved - quantity, 0);
//           }

//           /** ✅ Order Paid → Move reserved → sold */
//           if (status === 'paid') {
//             inv.reserved = Math.max(inv.reserved - quantity, 0);
//             inv.sold += quantity;
//           }

//           await this.repo.update(inv);
//         });
//       }

//       this.logger.log(`✅ Processed order update: ${orderId} → ${status}`);

//     } catch (err: any) {
//       this.logger.error(
//         `❌ Error in order.updated subscriber: ${err?.message || String(err)}`
//       );
//     }
//   }
// }
