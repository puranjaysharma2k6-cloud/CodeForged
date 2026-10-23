# F. Flip on Cycle

**Time limit:** 1 second  
**Memory limit:** 1.5 GB

Consider a grid graph with **N · M** nodes. Let's represent each node by a pair of numbers **(i, j)** - the row number **i** and the column number **j**. Two nodes **(i<sub>1</sub>, j<sub>1</sub>)** and **(i<sub>2</sub>, j<sub>2</sub>)** are said to be adjacent if and only if they share an edge, formally `|i_2 - i_1| + |j_2 - j_1| = 1`.

You have an **N × M** matrix **A**, where each **A<sub>i,j</sub>** is a binary number, i.e., 0 or 1. You would like to convert **A** to another binary matrix **B** of the same dimensions.

To do this, you can use the following operation **at most 500 times**:

- Choose a simple cycle in the graph. Flip the values of each cell in the cycle. Formally, for all nodes **(X, Y)** in the cycle replace **A<sub>X,Y</sub>** by **1 - A<sub>X,Y</sub>**.

If it is possible to convert the matrix **A** into **B**, output a possible sequence of operations of length at most 500. Otherwise, output `-1`.

In particular, note that you **do not have to minimize the number of operations used**.

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- Each test case consists of multiple lines of input.
  - The first line of each test case contains two space-separated integers **N** and **M** — the dimensions of the matrix.
  - The i-th of the next **N** lines each contain **M** integers - **A<sub>i,1</sub>, A<sub>i,2</sub>, ..., A<sub>i,M</sub>**.
  - The i-th of the next **N** lines each contain **M** integers - **B<sub>i,1</sub>, B<sub>i,2</sub>, ..., B<sub>i,M</sub>**.

## Output

For each test case, output the following:

- If we can convert **A** to **B**, first output **op** (`0 ≤ op ≤ 500`), the number of operations used. Then output the details of the **op** operations. For each operation:
  - First, output **K** (`3 ≤ K ≤ N · M`), the number of nodes present on the simple cycle chosen in this operation.
  - Then output a sequence of **2 · K** integers **i<sub>1</sub>, j<sub>1</sub>, i<sub>2</sub>, j<sub>2</sub>, ..., i<sub>K</sub>, j<sub>K</sub>** where **(i<sub>l</sub>, j<sub>l</sub>)** represents a node in the cycle. These **K** nodes must form a simple cycle in this order.
- If we cannot convert **A** to **B**, output `-1` on a new line.

## Constraints

- `1 ≤ T ≤ 500`
- `2 ≤ N, M ≤ 100`
- `N · M ≤ 200`
- `0 ≤ A_{i,j}, B_{i,j} ≤ 1`
- The sum of **N · M** over all test cases does not exceed `2000`.

## Example

**Input**

```
3
2 3
1 0 1
0 1 0
0 1 0
1 0 1
2 2
0 0
0 0
0 1
0 1
2 2
0 0
0 0
0 0
0 0
```

**Output**

```
1
6
1 1 1 2 1 3 2 3 2 2 2 1
-1
0
```

## Note

**Test Case 1:** We simply choose a cycle going through all 6 nodes in the grid. This flips each and every cell in the grid, and converts **A** to **B**.

**Test Case 2:** It can be proven to be impossible.

**Test Case 3:** **A = B** already, so no operations are needed.
