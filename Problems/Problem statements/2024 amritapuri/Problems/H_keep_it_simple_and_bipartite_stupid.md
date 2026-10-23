# H. Keep it Simple (and Bipartite) Stupid!

**Time limit:** 1 second  
**Memory limit:** 1.5 GB

Alice and Bob have been given a **simple** **bipartite** graph **G** with **N** nodes and **M** edges. They play a game on this graph.

Alternatively, starting from Alice, each player will add exactly 1 edge to the graph **G**. The graph must remain bipartite and simple after each edge addition.

The player unable to move loses, and the other player is declared the winner. Predict the winner of the game under optimal play from both players.

> **Simple:** A graph is said to be simple if there is at most one edge between any 2 pairs of nodes, and there is no edge between a node and itself. (No multi edges and no self edges.)
>
> **Bipartite:** A graph is said to be bipartite if the nodes can be partitioned into 2 sets **S** and **T** such that there is no edge between 2 nodes in **S**, and similarly, there is no edge between 2 nodes in **T**.

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- Each test case consists of multiple lines of input.
  - The first line of each test case contains two space-separated integers **N** and **M** — the number of vertices and edges of the graph, respectively.
  - The next **M** lines describe the edges. The i-th of these **M** lines contains two space-separated integers **u** and **v**, denoting an edge between **u** and **v**.

## Output

For each test case, output on a new line `Alice` or `Bob`, denoting the winner of the game.

It is allowed to print each character in either upper or lower case. `aLiCe`, `ALICE` and `alice` will all be accepted.

## Constraints

- `1 ≤ T ≤ 10^5`
- `1 ≤ N ≤ 2 · 10^5`
- `0 ≤ M ≤ 2 · 10^5`
- `1 ≤ u, v ≤ N` and `u ≠ v`
- Each unordered pair **(u, v)** occurs at most once.
- The given graph is bipartite.
- The sum of **N** and the sum of **M** both do not exceed `2 · 10^5`.

## Example

**Input**

```
3
3 2
1 2
2 3
2 0
3 1
1 2
```

**Output**

```
Bob
Alice
Alice
```

## Note

**Test Case 1:** On the first turn itself, Alice has no move. The only possible edge to add while keeping the graph simple is `(1, 3)`, but this edge breaks the bipartite condition. Thus, she loses.

**Test Case 2:** The given graph has 2 nodes and 0 edges. Alice adds the edge `(1, 2)` on her first turn. Now, it's Bob's turn, but there are no edges to add while keeping the graph simple.
