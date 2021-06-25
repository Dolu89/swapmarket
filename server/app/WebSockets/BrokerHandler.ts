import ws from 'ws'

export const brokerHandler = (body: any, wsClient: ws) => {
  if (!body.data.uuid) {
    wsClient.close(undefined, 'UUID missing')
    return
  }
  // const allBrokers = await getAllBrokers();
  // const anyBrokers = allBrokers.filter(
  //     (b) =>
  //         b.uuid === body.data.uuid || (b.name && b.name === body.data.name)
  // );
  // if (anyBrokers.length > 0) {
  //     connection.socket.close("Login failed");
  // }
  // connection.socket.id = body.data.uuid;
  // brokerHandlers(body, connection.socket);
  // sockets[body.data.uuid] = connection.socket;
}
