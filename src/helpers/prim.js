// very basic prim. we can improve by either:
// 1. creating our adjacency matrix directly from our cells
// 2. use a binary heap + adjacency list OR Fibonacci heap + adjacency list
//
// For a Fibonacci heap solution see:
// https://keithschwarz.com/interesting/code/?dir=prim
// https://keithschwarz.com/interesting/code/?dir=fibonacci-heap
//
// For a binary heap solutions see:
// https://www.youtube.com/watch?v=j5TbbNrXchs
// https://leetcode.com/problems/min-cost-to-connect-all-points/solutions/1467551/javascript-prim-with-a-min-heap-commented/
//
// Also (priority queue often implemented via binary heap):
// https://www.youtube.com/watch?v=jsmMtJpPnhU
// https://leetcode.com/problems/min-cost-to-connect-all-points/solutions/1983176/js-prims-lazy-mst-algorithm-with-explanation/

function createAdjMatrix(graph, numVertices) {
  // create N x N matrix filled with 0 edge weights between all vertices
  const adjMatrix = new Array(numVertices);

  for (let i = 0; i < numVertices; i++) {
    adjMatrix[i] = new Array(numVertices);
    adjMatrix[i].fill(0);
  }

  // populate adjacency matrix with correct edge weights
  for (let i = 0; i < graph.length; i++) {
    adjMatrix[graph[i][0]][graph[i][1]] = graph[i][2];
    adjMatrix[graph[i][1]][graph[i][0]] = graph[i][2];
  }

  return adjMatrix;
}

export default function prim(graph, numVertices) {
  const adjMatrix = createAdjMatrix(graph, numVertices);
  let vertex = Math.floor(numVertices / 2); // start somewhere in the middle

  // initialize empty edges array and empty tree
  const mst = [];
  const edges = [];
  const visited = [];
  let minEdge = [null, null, Infinity];

  // run prims algorithm until we create a minimum spanning tree
  // containing every vertex from the graph
  while (mst.length !== numVertices - 1) {
    // mark vertex as visited
    visited.push(vertex);

    // add each edge to list of potential edges
    for (let r = 0; r < numVertices; r++) {
      if (adjMatrix[vertex][r] !== 0) {
        edges.push([vertex, r, adjMatrix[vertex][r]]);
      }
    }

    // find edge with the smallest weight not yet visited
    for (let e = 0; e < edges.length; e++) {
      if (edges[e][2] < minEdge[2] && visited.indexOf(edges[e][1]) === -1) {
        minEdge = edges[e];
      }
    }

    // remove min weight edge from list of edges
    edges.splice(edges.indexOf(minEdge), 1);

    // push min edge to MST
    mst.push(minEdge);

    // start at new vertex and reset min edge
    vertex = minEdge[1];
    minEdge = [null, null, Infinity];
  }

  return mst;
}

// to check
//
// class Heap{
//   constructor(func){
//       this.heap = [];
//       this.func = func;
//   }
//   siftDown(idx,end,heap){
//       let child1 = idx*2+1;
//       while (child1 <= end){
//           let child2 = idx*2+2 <= end ? idx*2+2 : -1;
//           let swapIdx;
//           if (child2 !== -1 && this.shouldSwap(child2,child1)){
//               swapIdx = child2;
//           } else {
//               swapIdx = child1;
//           }
//           if (this.shouldSwap(swapIdx,idx)){
//               this.swap(swapIdx,idx,heap);
//               idx = swapIdx;
//               child1 = idx*2+1;
//           } else return;
//       }
//   }
//   siftUp(idx, heap){
//       let parent = Math.floor((idx-1)/2);
//       while (idx > 0 && this.shouldSwap(idx,parent)){
//           this.swap(idx,parent,heap);
//           idx = parent;
//           parent = Math.floor((idx-1)/2);
//       }
//   }
//   peek(){
//       return this.heap[0];
//   }
//   poll(){
//       this.swap(0, this.heap.length-1, this.heap);
//       let valueToReturn = this.heap.pop();
//       this.siftDown(0, this.heap.length-1, this.heap);
//       return valueToReturn;
//   }
//   offer(val){
//       this.heap.push(val);
//       this.siftUp(this.heap.length-1, this.heap);
//   }
//   isEmpty(){
//       return this.heap.length === 0;
//   }
//   size(){
//       return this.heap.length;
//   }
//   swap(i,j,heap){
//       [heap[i],heap[j]] = [heap[j],heap[i]];
//   }
//   shouldSwap(idx1,idx2){
//       return this.func(this.heap[idx1],this.heap[idx2]);
//   }
// }

// const distance = (p1,p2) => {
//   return Math.abs(p2[0]-p1[0]) + Math.abs(p2[1]-p1[1]);
// }
// const createConnectionsToVertex = (vertex, points, n) => {
//   let connections = []
//   for (let i = 0; i < n; i++){
//       if (i === vertex) continue;
//       connections.push([vertex,i, distance(points[vertex], points[i])]);
//   }
//   return connections;
// }
// const minCostConnectPoints = points => {
//   if (points === null || points.length <= 1) return 0;
//   const n = points.length, visited = new Set();
//   visited.add(0); // start at 0
//   const minHeap = new Heap((a,b) => a[2] < b[2]);
//   const connections = createConnectionsToVertex(0, points,n);
//   connections.forEach(edge => minHeap.offer(edge));
//   let minCost = 0;
//   while (!minHeap.isEmpty()){
//       const [start, next, cost] = minHeap.poll();
//       if (!visited.has(next)){
//           visited.add(next);
//           minCost += cost;
//           if (visited.size === n) return minCost; // early return
//           const edges = createConnectionsToVertex(next, points, n);
//           edges.filter(edge => !visited.has(edge[1])).forEach(edge => minHeap.offer(edge));
//       }
//   }
//   return minCost;
// }
