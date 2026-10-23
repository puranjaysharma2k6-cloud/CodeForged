# H. At Least Once

**Time limit:** 1 second  
**Memory limit:** 2048 MB

Given a string **S** consisting of lowercase English letters, find a subsequence of **S** which contains each letter present in **S** at least once. If there are multiple such strings, output the lexicographically minimum one.

## Input

The first line will contain a single integer **T** (`1 ≤ T ≤ 10`).

Each of the following **T** lines contains a single string **S** consisting of lowercase English letters (`1 ≤ |S| ≤ 10^4`).

## Output

For each test case, print in a single line the lexicographically minimum subsequence of **S** which contains each letter present in **S** at least once.

## Examples

**Input**

```
3
abcd
abca
acbbc
```

**Output**

```
abcd
abc
abbc
```

**Input**

```
7
aaabbbcccddd
dbca
acbdab
dbcddaabc
acbdacbd
aabbcababdabb
bssaaabbb
```

**Output**

```
aaabbbcccd
dbca
acbd
bcda
aacbd
aabbcaabd
bsa
```
