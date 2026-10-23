# A. 3 Partition

**Time limit:** 1 second  
**Memory limit:** 1.5 GB

You are given **3 · N** numbers **A<sub>1</sub>, A<sub>2</sub>, ..., A<sub>3N</sub>** (`1 ≤ A_i ≤ 3`).

You need to partition these **3N** integers into **N** triplets, each of size 3. Each of the triplets must have the same sum.

Formally, let **B<sub>i</sub> = [C<sub>(i,1)</sub>, C<sub>(i,2)</sub>, C<sub>(i,3)</sub>]** be the i-th triplet, then `C(i,1) + C(i,2) + C(i,3) = C(j,1) + C(j,2) + C(j,3)` for all `1 ≤ i, j ≤ N`.

Does a valid partition exist?

Print `Yes` if it is possible, or `No` otherwise. You do not need to construct the triplets themselves.

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- Each test case consists of two lines of input.
  - The first line of each test case contains **N** - the number of triplets needed.
  - The second line of each test case contains **3 · N** integers - **A<sub>1</sub>, A<sub>2</sub>, ..., A<sub>3N</sub>**.

## Output

For each test case, output on a new line `Yes` or `No` depending on whether it is possible.

It is allowed to print each character in either case, i.e. `yes`, `YES` and `yEs` will all be accepted as a positive response.

## Constraints

- `1 ≤ T ≤ 10^4`
- `1 ≤ N ≤ 10^5`
- `1 ≤ A_i ≤ 3`
- The sum of **N** over all test cases does not exceed `10^5`

## Example

**Input**

```
5
2
3 2 2 2 2 1
2
1 1 1 1 1 2
1
1 1 2
2
1 1 1 2 2 3
2
1 1 1 1 2 3
```

**Output**

```
Yes
No
Yes
Yes
No
```

## Note

**Test Case 1:** We can form the 2 triplets as `[1, 2, 3]` and `[2, 2, 2]`. Both sum to exactly 6.

**Test Case 2:** There exists no valid triplet partition.
