#!/bin/sh
# Haalt de oefening-thumbnails van i.ibb.co binnen naar public/exercise-thumbs/.
# Bestandsnaam = de ImgBB-code (uniek), zodat dubbele namen (8.png) niet botsen.
# Eenmalig gebruikt op 30 okt 2026; bijbehorende SQL: supabase/exercise-thumbs-van-ibb.sql
set -e
DOEL="$(dirname "$0")/../public/exercise-thumbs"
mkdir -p "$DOEL"
while read -r code pad; do
  [ -z "$code" ] && continue
  curl -sfL -o "$DOEL/$code.png" "https://i.ibb.co/$code/$pad" || echo "MISLUKT $code/$pad"
done <<'LIJST'
1GsTWxvZ 17.png
Zpqjrf5P 14.png
Gv7jqt6p 30.png
cS0yFqJh 28.png
s9rtD8nH Green-Linked-In-Banner-Professional-Name-8.png
217Yy6gs 8.png
JwBSH2gB Green-Linked-In-Banner-Professional-Name-9.png
7dWXz7nY 7.png
5h1F1dSm 20.png
6Rzy7sC0 11.png
nMg8RhyB 12.png
xtmqWfYk Green-Linked-In-Banner-Professional-Name-8.png
XkCvBy2y 19.png
Kp10SqC4 Green-Linked-In-Banner-Professional-Name-10.png
4wq3kXkg 16.png
rR8SzVsg Green-Linked-In-Banner-Professional-Name-7.png
RXkT66R 6.png
hJDwHhRt 8.png
LDFcJGgD Green-Linked-In-Banner-Professional-Name-7.png
Fbdx47YZ 24.png
0R7kQvdJ Green-Linked-In-Banner-Professional-Name-10.png
ccpWyRpv 21.png
Fb6SDkX4 6.png
gZXTGJfT 31.png
1fTxP4SP 26.png
W4R6QP7j 23.png
4wkV9Jjy 9.png
SwQ363Td Green-Linked-In-Banner-Professional-Name-6.png
ksJ8z3pG 32.png
jPDcBw0S Green-Linked-In-Banner-Professional-Name-9.png
846nzpc1 13.png
tpJvtYKD 25.png
hxbDjrX0 Een-titel-toevoegen-3.png
5xwtBPX1 10.png
LIJST
