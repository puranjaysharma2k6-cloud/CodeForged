# J. Sorting Again

**Time limit:** 1 second  
**Memory limit:** 1024 MB

You are given an array **A** (1-indexed) of **n** non-negative integers.

In one operation, you pick two indices **i, j** such that `1 ≤ i, j ≤ n` and **i + j is odd**, then you can swap **A<sub>i</sub>** and **A<sub>j</sub>**.

You can make as many operations as you want.

You want to sort the array in **strictly increasing** order. Can you do it?

## Input

The first line contains one integer **T**, denoting the number of test cases (`1 ≤ T ≤ 10`).

For each case, the first line contains an integer **n**, the size of the array (`1 ≤ n ≤ 50`).

The next line contains **n** integers denoting the elements of the array (`0 ≤ A_i ≤ 10^3`).

## Output

In a single line print `YES` if it is possible to sort the array with the allowed operations.

Otherwise print `NO` (without the quotes).

## Example

**Input**

```
2
4
8 3 7 2
4
2 3 5 2
```

**Output**

```
YES
NO
```

## Note

In the first case, we can make a swap between the 1st index and the 4th index as `1 + 4 = 5` is an odd number.
