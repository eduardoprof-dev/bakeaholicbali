const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function opsOrderStatus(status) {
  return ({ awaiting_payment:"PENDING", paid:"CONFIRMED", preparing:"PROCESSING", shipped:"FULFILLED", delivered:"DELIVERED", cancelled:"CANCELLED" })[String(status||"").toLowerCase()] || "PENDING";
}
function opsPaymentStatus(status) {
  return ({ awaiting_payment:"PENDING", paid:"PAID", preparing:"PAID", shipped:"PAID", delivered:"PAID", cancelled:"FAILED", expired:"EXPIRED", refunded:"REFUNDED" })[String(status||"").toLowerCase()] || "PENDING";
}
function storefrontOrderEvent(order, catalog, eventType="ORDER_CREATED") {
  const products=new Map((catalog?.items||[]).map(item=>[item.id,item]));
  const customerKey=String(order.customer?.phone||order.customer?.email||"").trim();
  const customerReference=customerKey?crypto.createHash("sha256").update(customerKey).digest("hex").slice(0,24):undefined;
  return {eventType,order:{id:order.id,createdAt:order.createdAt,customerReference,currency:"IDR",productSubtotal:Number(order.pricing?.subtotal||0),shippingTotal:Number(order.pricing?.deliveryFee||order.pricing?.shipping?.price||0),discountTotal:Number(order.pricing?.discount||0),taxTotal:Number(order.pricing?.tax||0),orderTotal:Number(order.pricing?.total||0),paymentStatus:opsPaymentStatus(order.status),orderStatus:opsOrderStatus(order.status),fulfillmentGroups:(order.fulfillmentGroups||[]).map(group=>({id:group.id,brandId:group.brandId,fulfillmentLocationId:group.fulfillmentLocationId,status:String(group.status||"PENDING").toUpperCase(),productSubtotal:Number(group.productSubtotal||0),shippingAllocated:0,items:(group.items||[]).map((line,index)=>{const product=products.get(line.itemId)||{};return{lineId:`${group.id}:${line.itemId}:${index}`,storefrontProductId:String(line.itemId),productName:String(product.name||line.itemId),sku:String(product.sku||product.barcode||line.itemId),quantity:Number(line.quantity||0),unitPrice:Number(line.unitPrice||0),lineTotal:Number(line.lineTotal||0),components:Array.isArray(line.components)?line.components:[]}})}))}};
}
function readOutbox(file){try{return JSON.parse(fs.readFileSync(file,"utf8"))}catch{return[]}}
function writeOutbox(file,rows){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,`${JSON.stringify(rows,null,2)}\n`,"utf8")}
async function deliver(entry,config){const response=await fetch(config.url,{method:"POST",headers:{"content-type":"application/json","x-storefront-sync-secret":config.secret,"x-idempotency-key":entry.idempotencyKey},body:JSON.stringify(entry.payload),signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error(`Ops sync returned ${response.status}`);}
async function enqueueStorefrontOrderSync(order,catalog,{dataDir,eventType="ORDER_CREATED",url=process.env.OPS_SYNC_URL,secret=process.env.STOREFRONT_SYNC_SECRET}={}){if(!url||!secret)return{queued:false,reason:"not_configured"};const file=path.join(dataDir,"ops-sync-outbox.json");const idempotencyKey=`${eventType}:${order.id}:${order.status}`;let rows=readOutbox(file);if(!rows.some(x=>x.idempotencyKey===idempotencyKey))rows.push({idempotencyKey,payload:storefrontOrderEvent(order,catalog,eventType),attempts:0,createdAt:new Date().toISOString()});writeOutbox(file,rows);const remaining=[];for(const entry of rows){try{await deliver(entry,{url,secret})}catch(error){remaining.push({...entry,attempts:Number(entry.attempts||0)+1,lastError:error instanceof Error?error.message:"Sync failed",lastAttemptAt:new Date().toISOString()})}}writeOutbox(file,remaining);return{queued:true,pending:remaining.length};}
module.exports={enqueueStorefrontOrderSync,opsOrderStatus,opsPaymentStatus,storefrontOrderEvent};
