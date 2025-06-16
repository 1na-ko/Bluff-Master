interface Card {
  type: string;
  id: string;
}
Page({
  data: {
    gameStarted: false,
    playerHand: [] as Card[],
    computerHand: [] as Card[],
    tableCards: [] as Card[],
    currentDeclare: null as {
      type: string;
      quantity: number;
      player: string;
    } | null,
    selectedCards: [] as string[],
    selectedDeclareType: null as string | null,
    selectedDeclareQuantity: null as number | null,
    isPlayerTurn: false,
    showMessage: false,
    message: '',
    showWinScreen: false,
    winnerName: '',
    showDeclareSelector: false,
    cardTypes: ['C++', 'C#', 'Go', 'Java', 'JavaScript', 'PHP', 'Python', 'Ruby'],
    cardIcons: {
      'C++': 'C++',
      'C#': 'C#',
      'Go': 'Go',
      'Java': '☕',
      'JavaScript': 'JS',
      'PHP': '🐘',
      'Python': '🐍',
      'Ruby': '💎',
      'Hello World': '⭐'
    },
    showCentralArea: false
  },

  // 创建牌组
  createDeck() {
    const deck = [];
    // 每种语言4张
    this.data.cardTypes.forEach(type => {
      for (let i = 0; i < 4; i++) {
        deck.push({ type, id: `${type}-${i}` });
      }
    });
    // 8张万能牌
    for (let i = 0; i < 8; i++) {
      deck.push({ type: 'Hello World', id: `hello-${i}` });
    }
    return deck;
  },

  // 洗牌
  shuffle(array: { type: string; id: string; }[]) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  },

  // 开始游戏
  startGame() {
    const deck = this.shuffle(this.createDeck());
    this.setData({
      gameStarted: true,
      playerHand: deck.slice(0, 10),
      computerHand: deck.slice(10, 20),
      tableCards: [],
      currentDeclare: null,
      selectedCards: [],
      isPlayerTurn: Math.random() < 0.5,
      showWinScreen: false
    });

    if (this.data.isPlayerTurn) {
      this.showMessage('你先手！选择要出的牌');
    } else {
      this.showMessage('电脑先手');
      setTimeout(() => this.computerTurn(), 1000);
    }
  },

  // 选择卡牌
  selectCard(e: { currentTarget: { dataset: { index: any; }; }; }) {
    if (!this.data.isPlayerTurn) return;

    const index = e.currentTarget.dataset.index;
    const cardId = this.data.playerHand[index].id;
    let selectedCards = [...this.data.selectedCards];

    // 切换选中状态
    if (selectedCards.includes(cardId)) {
      selectedCards = selectedCards.filter(id => id !== cardId);
    } else {
      selectedCards.push(cardId);
    }

    // 强制更新视图
    this.setData({
      selectedCards,
      playerHand: this.data.playerHand.map(card => ({
        ...card,
        selected: selectedCards.includes(card.id)
      }))
    });

    // 显示/隐藏确认按钮
    this.setData({
      showConfirmButton: selectedCards.length > 0
    });

    console.log("selected:", this.data.selectedCards)
  },

  // 确认出牌
  confirmPlay() {
    if (this.data.selectedCards.length === 0) return;

    // 检查所选牌是否同类型
    const selectedTypes = new Set();
    this.data.playerHand.forEach(card => {
      if (this.data.selectedCards.includes(card.id)) {
        selectedTypes.add(card.type);
      }
    });

    if (selectedTypes.size > 1) {
      this.showMessage('不能选择不同类型的牌组');
      // 清空选择状态
      this.setData({
        selectedCards: [],
        playerHand: this.data.playerHand.map(card => ({
          ...card,
          selected: false
        })),
        showConfirmButton: false
      });
      return;
    }

    // 原有逻辑
    this.setData({
      showDeclareSelector: true,
      selectedDeclareType: null,
      selectedDeclareQuantity: null
    });
  },

  // 选择声明类型
  selectDeclareType(e: { currentTarget: { dataset: { card: any; }; }; }) {
    this.setData({
      selectedDeclareType: e.currentTarget.dataset.card
    });
    console.log("selected:", this.data.selectedDeclareType)
  },

  // 选择声明数量
  selectDeclareQuantity(e: { currentTarget: { dataset: { quantity: string; }; }; }) {
    this.setData({
      selectedDeclareQuantity: parseInt(e.currentTarget.dataset.quantity)
    });
    console.log("selected:", this.data.selectedDeclareQuantity)
  },

  // 确认声明
  confirmDeclare() {
    if (!this.data.selectedDeclareType) {
      this.showMessage('请选择要声明的牌型');
      return;
    }

    // 使用已选牌的数量作为声明数量
    const quantity = this.data.selectedCards.length;

    // 执行出牌
    const playedCards: Card[] = [];
    const playerHand = [...this.data.playerHand];
    this.data.selectedCards.forEach(cardId => {
      const index = playerHand.findIndex(c => c.id === cardId);
      if (index !== -1) {
        playedCards.push(playerHand.splice(index, 1)[0]);
      }
    });

    this.setData({
      playerHand,
      tableCards: playedCards,
      currentDeclare: {
        type: this.data.selectedDeclareType,
        quantity: quantity,
        player: 'player'
      },
      selectedCards: [],
      isPlayerTurn: false,
      showDeclareSelector: false
    });

    // 检查胜利
    if (playerHand.length === 0) {
      this.endGame('player');
      return;
    }

    // 电脑回合
    setTimeout(() => this.computerDecision(), 1500);
  },

  // 电脑回合
  computerTurn() {
    this.showMessage('电脑正在出牌...');

    setTimeout(() => {
      const computerHand = [...this.data.computerHand];
      
      // 1. 随机选择出牌数量（1-4张）
      const quantity = Math.min(Math.floor(Math.random() * 4) + 1, computerHand.length);

      // 2. 随机选择牌，并确保是同类型的
      const selectedIndices: number[] = [];
      let selectedType = '';
      
      // 先随机选一张牌作为基准类型
      const firstIndex = Math.floor(Math.random() * computerHand.length);
      selectedIndices.push(firstIndex);
      selectedType = computerHand[firstIndex].type;
      
      // 从剩余牌中找同类型的
      for (let i = 0; i < computerHand.length && selectedIndices.length < quantity; i++) {
        if (i !== firstIndex && computerHand[i].type === selectedType) {
          selectedIndices.push(i);
        }
      }

      // 如果找不到足够同类型的牌，则只出已选中的牌
      const actualQuantity = selectedIndices.length;

      // 出牌
      const playedCards: Card[] = [];
      selectedIndices.sort((a, b) => b - a).forEach(index => {
        playedCards.push(computerHand.splice(index, 1)[0]);
      });

      this.setData({
        showCentralArea: true,
        computerHand,
        tableCards: playedCards,
        currentDeclare: {
          type: selectedType,
          quantity: actualQuantity, // 声明牌数等于实际出牌数
          player: 'computer'
        },
        showPlayerActions: true,
      });

      this.showMessage(`电脑声明：${actualQuantity} 张 ${selectedType}`);

      // 检查胜利
      if (computerHand.length === 0) {
        this.endGame('computer');
        return;
      }
    }, 1000);
  },

  // 电脑决策
  computerDecision() {
    this.showMessage('电脑正在思考...');

    setTimeout(() => {
      // 简单AI：50%概率质疑
      const shouldChallenge = Math.random() < 0.5;

      if (shouldChallenge) {
        this.doChallenge('computer');
      } else {
        this.doBelieve('computer');
      }
    }, 1500);
  },

  // 相信
  believe() {
    this.doBelieve('player');
    this.setData({
      isPlayerTurn: false,
      showPlayerActions: false,
      showCentralArea: false,
    });
  },

  // 执行相信
  doBelieve(believer: string) {
    this.showMessage(`${believer === 'player' ? '你' : '电脑'}选择相信`);

    // 继续游戏，切换出牌方
    this.setData({
      currentPlayer: this.data.currentDeclare ? this.data.currentDeclare.player : undefined
    });

    setTimeout(() => {
      if (believer === 'player') {
        this.showMessage('轮到你出牌');
        this.setData({ isPlayerTurn: true });
      } else {
        this.computerTurn();
      }
    }, 1000);
  },

  // 质疑
  challenge() {
    this.doChallenge('player');
    this.setData({
      showPlayerActions: false,
      showCentralArea: false,
    });
  },

  // 执行质疑
  doChallenge(challenger: string) {
    this.showMessage(`${challenger === 'player' ? '你' : '电脑'}选择质疑！`);

    setTimeout(() => {
      // 检查是否说谎
      const actualCards = this.data.tableCards;
      const declaredType = this.data.currentDeclare && this.data.currentDeclare.type;
      const declaredQuantity = this.data.currentDeclare && this.data.currentDeclare.quantity;

      let matchCount = 0;
      actualCards.forEach(card => {
        if ((card as { type: string; id: string }).type === declaredType || 
            (card as { type: string; id: string }).type === 'Hello World') {
          matchCount++;
        }
      });

      const isBluff = matchCount < declaredQuantity!;

      setTimeout(() => {
        if (isBluff) {
          // 质疑成功
          this.showMessage('质疑成功！对方说谎了！');

          // 说谎者收回牌
          const liar = this.data.currentDeclare && this.data.currentDeclare.player;
          if (liar === 'player') {
            this.setData({
              playerHand: [...this.data.playerHand, ...actualCards].map(card => ({
                ...card,
                selected: false // 清除选中状态
              })),
              selectedCards: [],
              tableCards: []
            });
          } else {
            this.setData({
              computerHand: [...this.data.computerHand, ...actualCards],
              tableCards: []
            });
          }

          // 质疑者开始新一轮
          this.setData({
            currentPlayer: challenger,
            currentDeclare: null
          });
        } else {
          // 质疑失败
          this.showMessage('质疑失败！对方没有说谎！');

          // 质疑者收回牌
          if (challenger === 'player') {
            this.setData({
              playerHand: [...this.data.playerHand, ...actualCards].map(card => ({
                ...card,
                selected: false // 清除选中状态
              })),
              selectedCards: [],
              tableCards: []
            });
          } else {
            this.setData({
              computerHand: [...this.data.computerHand, ...actualCards],
              tableCards: []
            });
          }

          // 被质疑者开始新一轮
          this.setData({
            currentPlayer: this.data.currentDeclare ? this.data.currentDeclare.player : undefined,
            currentDeclare: null
          });
        }

        // 开始新一轮
        setTimeout(() => {
          if (this.data.isPlayerTurn) {
            this.showMessage('轮到你出牌');
            this.setData({ isPlayerTurn: true });
          } else {
            this.computerTurn();
          }
        }, 2000);
      }, 2000);
    }, 1000);
  },

  // 游戏结束
  endGame(winner: string) {
    this.setData({
      showWinScreen: true,
      winnerName: winner === 'player' ? '你赢了！🎉' : '电脑赢了！😅',
      showCentralArea: false,
    });
  },

  // 重新开始
  restartGame() {
    this.setData({
      showWinScreen: false,
      gameStarted: false
    });
  },

  // 显示消息
  showMessage(message: string) {
    this.setData({
      message,
      showMessage: true
    });

    setTimeout(() => {
      this.setData({ showMessage: false });
    }, 3000);
  }
});
