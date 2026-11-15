# Minening — Game Design Document

## 1. Informação Básica
- **Título:** Minening
- **Gênero:** Incremental, Aventura
- **Plataforma:** PC (Steam)
- **Engine:** Godot 4.7.2

## 2. Concept
O jogo será um jogo incremental onde o personagem principal irá minerar minérios numa caverna com diferentes níveis, cada nível terá um diferente tipo de minério, os minérios serão usados como moedas para comprar diferentes upgrades para o jogador. A experiência buscada é de uma curva de evolução e aceleração, no começo será um uma mineração e um combate mais lentos, no end game (Último nível) será uma experiencia mais caôtica e acelerada.

## 3. Inspirações
A mecânica é inspirada em jogos incrementais como "A game about feeding a black hole", "Keep On Mining" e "Shelldivers".
A arte será inspirada em Stardew Valley e Forager.

## 4. Mecânicas Principais

### O Jogador
O jogador irá descer nas minas para coletar minérios, minérios esses que serão usados como moeda para os upgrades. O jogador também tem um nível, que começa no 1. Cada upgrade comprado além dos efeitos, também da ao jogador 1 nível.

A mineração acontece de forma ativa quando o jogador aperta o botão esquerdo do mouse, ela acontece em um pequeno arco a frente do jogador na direção do ponteiro do mouse, como se fosse um ataque com uma espada de um lado ao outro do jogador.

O jogador terá uma espécie de barra de vida que servirá como um Timer para o jogador na Run, ela vai caindo com o tempo, caso seja atacado por inimigos o jogador também perderá um pouco da barra de vida. Caso chegue a zero o jogador desmaia e volta para base perdendo 70% de tudo que coletou naquela Run, o jogador pode escolhar voltar para base antes disso, assim assegurando tudo que coletou.

### A base
A base é o lugar para onde o jogador vai entre as runs, nessa base é onde ele ira gastar os minerios e recursos coletados na run para comprar os upgrades, haverá uma pequena loja lá para a compra dos mesmos.

### Os upgrades
Os upgrades são o que farão a curva de poder do jogar aumentar, o custo deles deve aumentar exponencialmente para refletir uma curva não linear de progressão de poder, porém assim como custo aumenta, também aumentara a quantidade de recursos que o jogador pode coletar. Os upgrades serão listados no item 9.

### As Minas
As minas são aonde o jogador irá coletar os minérios, as minas terão 4 níveis e cada nível terá 3 andares, cada nível de cada andar terá um nível do jogador necessário para desbloquear (Exemplo, Nível 2 do Andar 1 desbloqueia quando o jogador chegar no nível 15). (Para um protótipo teremos apenas 2 andares com 3 níveis cada)

### Os Minérios
Haverá um tipo de minérios por andar da mina, cada tipo, dropa um minérios diferente. Os minérios estarão em nodos espalhados pelo andar da mina, ao entrar na mina eles devem nascer espalhados de forma aleatória pelo nível.

### Os inimigos
Os inimigos funcionarão da mesma forma que os minérios, terá um tipo de inimigo por andar e eles vão dropar um item, diferente dos minérios, todos os inimigos dropam o mesmo item. O foco do jogo é mais a mineração do que o combate, sendo assim, o combate não deve ser tão difícel e os inimigos servirão apenas como uma pequena incovêniencia na jornada.

## 5. Game Loops

O Game Loop de uma Run:
1. Jogador começa em uma base
2. Jogador desce para a mina
3. Jogador minera os minérios disponíveis
4. Jogador volta para a base
5. Jogador compra upgrades
6. De volta ao passo 1

O Game Loop do jogo é:
1. Jogador começa no nivel 1
2. Jogador faz uma run de mineração
3. Jogador volta da run
4. Jogador compra um upgrade
5. Jogador ganha 1 nível por upgrade comprado
6. Caso tenha atingido o nível necessário, um novo andar da mina é desbloqueado

## 6. Temática
A temática do jogo é nos moldes de um Bright Fantasy medieval, o plano de fundo da história é que uma guerra está acontecendo na superfície, por conta da guerra, os minerios estão acabando e assim o jogador se vê obrigado a ir na mina do jogo para coletar minérios, porém essa mina está com um gás tóxico e nunca foi explorada direito. O gás tóxico é o plano de fundo para barra de vida do jogador.

### Os andares das minas
Cada andar da mina terá será um bioma específico:

**Andar 1 - A antiga mina (Fará parte do prótotipo):**
Uma mina padrão com chão de pedra e terra, um pouco de água escorrendo pelas paredes e pelo chão, algumas estruturas antigas de minerações passadas que deram errado, com os esqueletos de mineradores no chão.
O minério desse andar será o Ferro, o inimigo serão ratos.

**Andar 2 - Caverna de Cristal (Fará parte do prótotipo):**
Uma caverna de cristais azulados, chão claro com tons azulados, estalactites de cristal espalhados pelas paredes, aqui não há sinais de visitas de humanos.
O minério desse andar será a Sáfira, o inimigo será golems de cristal.

**Andar 3 - Caverna Verdejante** (A definir)
**Andar 4 - Caverna de Lava** (A definir)
**Andar 5 - Caverna Tóxica** (A definir)

## 7. Direção Artística
A resolução de viewport do jogo será 320x180.

O jogo terá a arte toda em Pixel Art, o jogador deverá ser um asset de 16x16, os outros assets poderão ter resolução maior ou menor dependendo do tamanho do objeto, porém o tamanho do pixel deve sempre ser respeitado, e o asset do jogador deve sempre ser usado como base o tamanho dos outros, mixels não serão tolerados. O estilo deve se assemelhar ao estilo do jogo "Forager" e do jogo "Celeste".

Os elementos de UI também devem ter 16x16, e devem seguir a temática de mineração.

O jogo deve usar EXCLUSIVAMENTE essas cores e nenhuma outra (paleta Endesga 32 — substituiu a paleta original de 16 cores):

```
#be4a2f #d77643 #ead4aa #e4a672 #b86f50 #733e39 #3e2731 #a22633
#e43b44 #f77622 #feae34 #fee761 #63c74d #3e8948 #265c42 #193c3e
#124e89 #0099db #2ce8f5 #ffffff #c0cbdc #8b9bb4 #5a6988 #3a4466
#262b44 #181425 #ff0044 #68386c #b55088 #f6757a #e8b796 #c28569
```

> Revisões de direção (após o primeiro protótipo):
> - Visual mais moderno, inspirado em Stardew Valley (não "GBA").
> - A base é um lugar: a entrada da mina, com um NPC que vende os upgrades.
> - Movimento livre (inclui diagonais); só o sprite tem 4 direções.
> - Sprite do jogador mais estreito.
> - Upgrades em uma árvore de talentos baseada em nós (inspiração: "A Game About Feeding A Black Hole").
> - Escala dobrada: resolução de viewport **480x270**, jogador e tiles em **32x32** (substitui 320x180 e 16x16 abaixo). A regra de não ter mixels continua.
> - Estilo visual: visão top-down de **Enter the Gungeon** (contorno escuro de 1px, chão escuro, personagens chibi de cabeça grande), referências em `references/`. Os nós de minério são **um pouco maiores que o personagem** (referência: Don't Starve). Substitui a inspiração Stardew Valley.
> - A UI, a árvore de talentos e o Andar 1 (A Antiga Mina) também passam a ser desenhados à mão por código; o jogo inteiro renderiza em resolução cheia. O Andar 2 (Caverna de Cristal) também foi convertido: o jogo todo é desenhado à mão.
> - Árvore de talentos grande: **cada nível de um talento é um nó próprio** (116 nós em 4 regiões: mineração, riqueza, sobrevivência, combate). O custo de cada nó cresce numa curva conforme a profundidade dele na árvore. Cada nó comprado dá 1 nível ao jogador.
> - A base (entrada da mina, mercador e o mineiro enquanto está na base) passa a ser **desenhada à mão por código** (arte vetorial gerada a partir de código, não por IA), renderizada em resolução cheia. As minas continuam em pixel art.

O jogo deve ter um foco em game feel, com tweens nos botões para uma boa e rapida resposta ao jogador.

## 8. Os 3 Cs
O personagem terá movimentação em 4 eixos (Norte, Sul, Leste e Oeste) e será controlado por W A S D. A mineração será direcionada pelo mouse e acionada ao clicar com o botão esquerdo do mouse.

A camera devera seguir o jogador sempre, mas terá de ter um limite para não mostrar partes do jogo que não estejam sem nenhum tile.

## 9. Os upgrades
Aqui está uma lista dos upgrades que deverão ter no jogo (A lista pode ser atualizada posteriormente):

- Aumento de dano no nodos de minério
- Aumento na velocidade de mineração
- Diminuição da queda do HP do player
- Aumento na quantidade de minerio que cai de cada nó
- Aumento de dano nos inimigos
- Diminuição de quanto de HP o ataque dos inimigos tira
- Aumento no raio do arco de mineração
- Proc de um um grupo de picaretas que giram ao redor do jogador
- Chance de um nó de minerio criar outros nós de minerio ao redor dele ao quebrar
- Ao derrotar um inimigo recupera um pouco do HP
