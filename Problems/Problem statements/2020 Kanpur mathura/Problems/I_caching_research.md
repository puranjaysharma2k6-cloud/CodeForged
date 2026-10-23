# I. Caching Research

**Time limit:** 2 seconds  
**Memory limit:** 1024 MB

Ted, the great computer scientist, was recently doing some serious research on caching mechanisms. He had some data, which can be represented as a permutation of size **n**, and he decided to make some operations on it.

In each operation,

- He chooses some index **i** (`1 ≤ i ≤ n`),
- Moves **P<sub>i</sub>** to the front of the permutation.

For example, let's assume the initial permutation is `{4, 1, 5, 3, 2}` and the index sequence of operations is `(2, 5, 4)`.

- After the 1st operation, the permutation becomes `{1, 4, 5, 3, 2}`.
- After the 2nd operation, the permutation becomes `{2, 1, 4, 5, 3}`.
- After the 3rd operation, the permutation becomes `{5, 2, 1, 4, 3}`.

After making some operations on a permutation, he left his room for some time. When he got back he could see the initial permutation and also the final permutation but he couldn't remember which operations he made. But he remembers how many operations he made. Now he wonders: how many possible sequences of operations are there which would take him from the initial permutation to the final permutation? As the number can be quite large, output it modulo **998244353**.

## Input

The first line of input consists of a single integer **T** (`1 ≤ T ≤ 3`), the number of test cases.

Each test case consists of three lines as follows:

- The first line of the test case contains **n**, the length of the permutation, and **m**, the length of the operation sequence (`1 ≤ n, m ≤ 10^5`).
- The second line contains **n** space-separated distinct integers, denoting the initial permutation **A** (`1 ≤ A_i ≤ n`).
- The third line contains **n** space-separated distinct integers, denoting the final permutation **B** (`1 ≤ B_i ≤ n`).

## Output

For each test case print one integer: the number of possible operation sequences of length **m**, modulo **998244353**.

Two sequences are considered different if there is at least one index where they differ.

## Example

**Input**

```
1
4 2
3 2 4 1
1 3 2 4
```

**Output**

```
2
```

## Note

We define a sequence of integers of length **n** as a permutation **P** if every integer from 1 to **n** appears exactly once in the sequence.
