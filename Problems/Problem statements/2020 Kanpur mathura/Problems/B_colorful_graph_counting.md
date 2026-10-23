# B. Colorful Graph Counting

**Time limit:** 1 second  
**Memory limit:** 2048 MB

You are given three numbers **N**, **K** and **L**. You have to calculate the number of graphs such that:

- The graph is an undirected, simple graph (no multi-edge and no self-loops),
- The graph consists of exactly **N** nodes,
- Each node will have a color which is denoted by an integer in the range `[1, K]`,
- For any node **u** having color **c<sub>u</sub>** and any other color **p ≠ c<sub>u</sub>**, there exist **at least L nodes** with color **p** reachable from node **u**.
- Node **a** is considered to be reachable from node **b**, if there exists a sequence of edges which connects node **a** and node **b**.

For example, when **K = 3** and **L = 5**, this means:

- For any node of color 1, there must be at least 5 nodes of color 2 and at least 5 nodes of color 3 reachable from that node.
- For any node of color 2, there must be at least 5 nodes of color 1 and at least 5 nodes of color 3 reachable from that node.
- For any node of color 3, there must be at least 5 nodes of color 1 and at least 5 nodes of color 2 reachable from that node.

Two graphs are considered to be different if either of the following holds true:

- There is at least one node such that the color of that node is different in the two graphs,
- There is at least a pair of nodes **(u, v)** such that there is an edge between **u** and **v** in one graph and not in the other graph.

As the result can be very large, output it modulo **998244353**.

## Input

The only line of input contains 3 integers **N**, **K** and **L** (`1 ≤ N, K, L ≤ 5000`).

## Output

Output the number of graphs modulo **998244353**.

## Examples

**Input**

```
4 2 2
```

**Output**

```
228
```

**Input**

```
9 2 2
```

**Output**

```
559252829
```
