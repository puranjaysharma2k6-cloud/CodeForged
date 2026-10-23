# E. Shelter Home

**Time limit:** 4 seconds  
**Memory limit:** 1024 MB

Batman protects the people of Gotham from various superhuman villains. Apart from superhuman villains, another problem arose in Gotham. Too many people lost their homes because of the fight between Batman and superhuman villains; they fought and demolished buildings after buildings. But Batman is very wealthy and generous too. So he made a list of **n** people whose house he broke. He wants to give them a new home. He also wants to minimize the total number of homes built. So he gave the optimal home assignment task to Robin, his son.

Robin numbered the **n** people from **0** to **n-1**. Then he gave Batman **m** pairs of numbers **(i, j)**, where `0 ≤ i, j ≤ n-1` and `i ≠ j`. Such a pair means the i<sup>th</sup> person wants to stay with the j<sup>th</sup> person in the same house and vice versa. The rest of the pairs don't like each other so they won't stay together.

Now the next phase of assigning houses to people is given to you. You don't need to fulfill each person's wish of who they want to stay together, but you also can't put two persons in the same house if they don't want to stay together. You have to output the minimum number of houses needed to be built so every person gets a house. Assume each house can hold a maximum of **k** people.

## Input

The first line contains the number of test cases **t** (`0 < t ≤ 10`).

The first line of each test case contains three numbers **n** (`0 ≤ n ≤ 20`), **m** (`0 ≤ m ≤ n * (n-1)/2`) and **k** (`0 < k ≤ 20`) defined as above. Then the following **m** lines each contain two integers **i** and **j**, meaning the i<sup>th</sup> person and the j<sup>th</sup> person want to stay together. Here `0 ≤ i, j < n` and `i ≠ j`.

## Output

For each test case output only one line: the minimum number of houses that need to be built.

## Example

**Input**

```
2
2 1 1
1 0
5 3 3
0 1
1 2
3 4
```

**Output**

```
2
3
```
