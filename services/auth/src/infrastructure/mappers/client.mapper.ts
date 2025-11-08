export class ClientMapper {
  static toDomain(doc: any) {
    return {
      id: doc._id.toString(),
      clientId: doc.clientId,
      clientName: doc.clientName,    
      clientSecretHash: doc.clientSecretHash,   // ✅ Correct
      redirectUris: doc.redirectUris,
      grantTypes: doc.grantTypes,
      scopes: doc.scopes,
    };
  }

  static toPersistence(client: any) {
    return {
      clientId: client.clientId,
      clientName: client.clientName,     
      clientSecretHash: client.clientSecretHash,   // ✅ FIXED
      redirectUris: client.redirectUris,
      grantTypes: client.grantTypes,               // ✅ Added (your schema has this)
      scopes: client.scopes,
    };
  }
}
