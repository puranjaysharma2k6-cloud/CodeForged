# D. Delete if Equal

**Time limit:** 1 second  
**Memory limit:** 1.5 GB

You are given a binary string **S** of size **N**. You can do the following operation as many times as you want:

- Choose an index **i** satisfying `1 < i < |S|` and `S_{i-1} = S_{i+1}`, and delete **S<sub>i</sub>** from the string. Then, concatenate the 2 parts `S[1, i-1]` and `S[i+1, |S|]` to form the new string **S**. Note that the length of **S** reduces by 1 after each operation.

Find the minimum possible length of the final string after performing any number of operations.

## Input

- The first line of input will contain a single integer **T**, denoting the number of test cases.
- Each test case consists of two lines of input.
  - The first line of each test case contains **N** - the length of the binary string **S**.
  - The second line contains **S** - a binary string of size **N**.

## Output

For each test case, output on a new line the minimum possible length of the final string.

## Constraints

- `1 ≤ T ≤ 10^4`
- `1 ≤ N ≤ 2 · 10^5`
- `S_i ∈ {0, 1}`
- `|S| = N`
- The sum of **N** over all test cases does not exceed `2 · 10^5`

## Example

**Input**

```
6
3
101
4
0010
1
1
4
0101
5
11011
5
01001
```

**Output**

```
2
2
1
3
2
3
```

## Note

**Test Case 1:** We choose `i = 2` in the first and only operation, and since `S_1 = S_3`, we delete `S_2`. The final string is `11`. Note that no more operations are possible because it is impossible to pick **i** satisfying `1 < i < |S|`.

**Test Case 2:** We perform the following sequence of operations:

- `i = 3`: `S_2 = S_4 = 0` so this is valid. We delete `S_3` from the string to get `000`.
- `i = 2`: After the first operation, `S_1 = S_3 = 0` so this is valid. We delete `S_2` from the string to get `00`.

Thus, our answer is 2.
