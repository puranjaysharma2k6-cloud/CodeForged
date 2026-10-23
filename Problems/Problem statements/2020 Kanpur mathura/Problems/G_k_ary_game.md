# G. K-ary Game

**Time limit:** 1 second  
**Memory limit:** 2048 MB

Alice and Bob will play a game on a **perfect K-ary rooted tree** of **depth D**, where **K is even**. This means:

- Each non-leaf node has exactly **K** children.
- Each leaf will be at the same depth **D**.
- Depth of the root is **0**.

Initially both of them have 0 points. In each move, a player can delete exactly one node and this node's degree will be added to his total points. Deleting a node will automatically remove its adjacent edges. Each node can be deleted at most once.

Each player wants to maximize his own points. Both players will play optimally.

If Alice moves first, output the maximum points that Alice can achieve.

## Input

The first line will contain a single integer **T** (`1 ≤ T ≤ 10^5`).

Each test case will contain two integers denoting **K** (`2 ≤ K ≤ 10^9`, K is even) and **D** (`1 ≤ D ≤ 10^9`).

## Output

For each test case, output in a single line the maximum points Alice can achieve.

Since the answer can be pretty large, output the value modulo `10^9`.

## Example

**Input**

```
5
4 1
2 1
4 2
2 4
2 3
```

**Output**

```
4
2
12
16
8
```
