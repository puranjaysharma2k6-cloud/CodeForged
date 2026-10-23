# F. Loba's Revenge

**Time limit:** 2 seconds  
**Memory limit:** 2048 MB

Revenant, a robot assassin, killed Loba's parents when she was just a child, and since then she has been meticulously hunting down Revenant in underground bunkers of Olympus in a hate-fueled quest for revenge. Revenant has lived for thousands of years, killing hundreds of people. Now, he wants to just die. But how can a robot die? The secret lies in his source code, which is hidden from him by his creator. Loba, with her revengeful mind, found the source code on the World's Edge. For Revenant, this means he will be damned to eternal life, as his source code was the only way to end his existence. So, Loba threw it through a phase runner in King's Canyon, making it pretty much untraceable. Infuriated, Revenant begins to attack Loba. So, she hides in the secret toxic chamber of Caustic, creator of King's Canyon and a friend of Loba.

Eventually, Revenant found the chamber of Caustic. Since Caustic enjoys nothing except the suffering of others, he has given Revenant the impossible task of passing through the phase runner. For that, he has also given Revenant the map of the phase runner. The phase runner consists of **n** one dimensional chambers, numbered from **1** to **n**, where the i<sup>th</sup> and (i+1)<sup>th</sup> chambers are next to each other. Each chamber is toxic and the toxicity of the i<sup>th</sup> chamber is given by an integer **A<sub>i</sub>**. Revenant knows the toxicity of each chamber. A normal person cannot survive these toxic chambers but Revenant is a robot, no problem for him. But even for him, it is impossible to move through these toxic chambers without the help of Watson, the daughter of Caustic, as she put electric fences everywhere in the chambers. Due to the nature of gas, these electric fences require a special type of batteries.

She has a limited amount of batteries. She needs to calculate the number of batteries needed to power the fences so that she can optimally use the batteries. If the power of a battery type is **g**, the number of batteries needed to power the fences from the L<sup>th</sup> chamber to the R<sup>th</sup> chamber is the length of the longest sub-segment `A[i], A[i+1], ..., A[j]` such that `L ≤ i ≤ j ≤ R` and `gcd(A[i], A[i+1], ..., A[j]) = g`. Let's define this length as **C**, i.e. `j - i + 1 = C`. If there exists no such sub-segment, then **C = 0**.

She has given Revenant **Q** queries. Upon answering these queries, she will gift him the portal of Wraith. Portal of Wraith is a tunnel in fourth dimensional space, which allows the traveller to pass through the fences and toxic gases without being harmed.

## Input

The first line contains an integer **n**, the number of elements of array **A**.

The second line contains **n** space separated integers that represent `A[1], A[2], ..., A[n]`.

The third line contains an integer **Q**, the number of queries. Each of the next **Q** lines contains three integers **g, L, R**.

## Output

For each query, we get a value of **C**. Your task is to print only one line: the **XOR** of all C's.

## Constraints

- `1 ≤ n ≤ 50000`
- `1 ≤ A[i] ≤ 10^18`
- `1 ≤ Q ≤ 100000`

## Example

**Input**

```
6
3 3 3 6 12 3
9
3 1 3
3 2 5
3 3 6
6 4 6
6 5 6
3 4 6
3 1 6
5 5 5
12 5 5
```

**Output**

```
5
```

## Note

The greatest common divisor (gcd) of two or more integers, which are not all zero, is the largest positive integer that divides each of the integers, and `gcd(a, b, c) = gcd(gcd(a, b), c)`.
