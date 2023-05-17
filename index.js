const random = (min, max) => Math.trunc(Math.random() * (max - min + 1) + min)

let nnn = 0


class Airplane {
  constructor (opt) {
    this.data = opt
    this.$ = jQuery
    this.difficulty = ['简单模式', '一般模式', '困难模式', '地狱模式']
    // 敌机出现强化飞机的概率
    this.mod = ['small', 'small', 'small', 'big']
    // 敌机的生成速度
    this.enemySpeed = [500, 400, 300, 200]
    this.title = '飞机大战净化版'

    // 敌机生成的定时器id
    this.enemyTime = 0
    // 子弹的生成速度
    this.biuSpeed = [300, 250, 200, 150]
    // 得分
    this.score = 0
    // 子弹的威力
    this.biuStrong = 1

    // 我军子弹定时器
    this.biuTime = 0

    this.enemyHP = {
      big: {
        hp: 3
      },
      small: {
        hp: 1,
      }
    }



    // 游戏的挂载点，
    this.app = this.$(this.data.app)
    // 初始化界面
    this._init()
  }
  // 初始化函数
  _init () {
    // 清除游戏界面
    this.app.html("")
    // 设置游戏界面宽高
    if (this.app.height() == 0) {
      this.app.css({
        margin: '20px auto',
        'box-shadow': '0 0 3px rgba(0,0,0,.3)',
        background: 'url(./img/bg2.jpg) no-repeat center/cover',
        width: this.data.width,
        height: this.data.height,
        position: 'relative'
      })
    }
    // 创建游戏标题
    let $h1 = $(`<h1 class="">${this.title}</h1>`)
    this.app.append($h1)
    
    // 生成模式按钮
    for (let i = 0; i < this.difficulty.length; i++){
      let $option = this.$(`<div class='option'>${this.difficulty[i]}</div>`)

      $option.click(e => {
        this.startGame(i, e)
      })
      this.app.append($option)
    }
  }

  // 启动游戏
  startGame (opt, event) {
    // opt：0 简单模式 1一般模式 2困难模式 3地狱模式
    this.app.html('')
    this.app.get(0).className = 'bg' + (opt + 1) 
    
    // 调用敌机的生成
    this.enemyTime = setInterval(() => {
      // 随机取飞机的模型
      let m = this.mod[Math.trunc(Math.random() * this.mod.length)]
      // 开始生成
      this.enemy(m, this.enemySpeed[opt])
    }, this.enemySpeed[opt])
    

    // 生成我方飞机
    this.myPlane(event, opt)
    
  }

  // 生成敌机 - 一个
  enemy (mod, s) {
    let $enemy = this.$(`<div class="enemy ${mod}" data-hp=${this.enemyHP[mod].hp}></div>`).append(`<img src="./img/enemy_${mod}.png">`)


    // 生成血条
    let $hp = this.$(`<div class='hp' data-hhp=${this.enemyHP[mod].hp}><div></div></div>`)

    $enemy.append($hp)
    
    $enemy.css({
      top: 0,
      left: random(0, this.data.width - 50)
    })

    this.app.append($enemy)

    let speed = random(3, 5)
    // 控制飞机下落
    let run = () => {
      let top = $enemy.position().top + speed
      $enemy.css('top', top)
      // 标签存在game标签中 才回调
      

      if (top < this.data.height) {
        $enemy.parent().length && requestAnimationFrame(run)
      }else{
        $enemy.remove()
      }
    }
    
    run()
  }
  // 生成我方飞机
  myPlane (e, opt) {
    let planeH = 0
    let planeW = 0


    let $plane = this.$('<div class="myPlane"></div>')
    let $img = this.$(`<img class="plane-img" src="./img/plane_1.png">`)
    
    $plane.append($img)
    this.app.append($plane)
    let appOffset = this.app.offset()

    $img.on('load', () => {
      planeH = $plane.height()
      planeW = $plane.width()
      let top = e.pageY - appOffset.top - planeH / 2
      let left = e.pageX - appOffset.left - planeW / 2

      $plane.css({
        top,
        left
      })

      this.biuTime = setInterval(this.createBiu.bind(this), this.biuSpeed[opt], $plane)

    })
    
    this.$(document).mousemove(e => {
      let top = e.pageY - appOffset.top - planeH / 2
      let left = e.pageX - appOffset.left - planeW / 2

      left = Math.max(0 - planeW / 2, left)
      left = Math.min(this.data.width - planeW / 2, left)
      top = Math.max(0, top)
      top = Math.min(this.data.height - planeH, top)

      $plane.css({
        top,
        left
      })

      // 移动时 跟敌机进行碰撞检测
      let ene = $('.enemy')

      for (let i = 0; i < ene.length; i++){
      
        if(ene[i] && this.isDuang($(ene[i]), $plane)) {
          $plane.remove()
          $(ene[i]).remove()
          // 游戏结束

          this.gameover()

        }
      }


    })
    
  }
  // 生成子弹 
  createBiu ($plane) {
    let $biu = this.$('<img class="biu" src="./img/fire.png">')
    
    $biu.css('left', $plane.position().left + $plane.width() / 2 - 3)
    $biu.css('top', $plane.position().top)
   
    this.app.append($biu)
    
    let run = () => {
      let top = $biu.position().top - 7
      $biu.css('top', top)

      if (top > 0) {
        $biu.parent().length && requestAnimationFrame(run)

        // 检测子弹跟敌机的碰撞
        let ene = $('.enemy')

        for (let i = 0; i < ene.length; i++){
          // 成功消灭一个敌机
          if(ene[i] && this.isDuang($(ene[i]), $biu)) {
            // 记录分数
            this.recordScore($(ene[i]))

            $biu.remove()
            
            if ($(ene[i]).data('hp') <= 0) {
              // 不着急清除飞机。因为要读取该飞机的定位值，定位值 用在爆炸图上\
              this.boom($(ene[i]))
              $(ene[i]).remove()
            }
          }
        }


      }else{
        // 超出范围时，删除标签
        $biu.remove()
      }
    }
    
    run()
  }

  // 检测碰撞  false 未碰撞 true 碰撞了
  isDuang (a, b) {
    let res = false

    let {top: t1, left: l1} = a.position()
    let b1 = t1 + a.height()
    let r1 = l1 + a.width()

    let {top: t2, left: l2} = b.position()
    let b2 = t2 + b.height()
    let r2 = l2 + b.width()

    res = b2 < t1 || r1 < l2 || b1 < t2 || r2 < l1

    return !res
  }

  // 游戏结束
  gameover () {
    // 关闭相关定时
    clearInterval(this.enemyTime)
    clearInterval(this.biuTime)

    // 得分界面
    this.app.html('')

  }

  // 统计分数
  recordScore ($ene) {
    let isBig = $ene.hasClass('big')

    if (isBig) {
      let restHP = $ene.data('hp') - this.biuStrong
      if (restHP > 0) {

        $ene.data('hp', restHP)
        let $hp = $ene.children('.hp')
        $ene.find('.hp div').width( restHP/$hp.data('hhp') * $hp.width())

      }else{
        $ene.data('hp', "0")
        this.score += 5
      }

    }else{
      $ene.data('hp', "0")
      this.score++ 
    }
    this.$('.score').html(this.score)
  }


  // boom图
  boom ($ene) {
    let position = $ene.position()
    let isBig = $ene.hasClass('big')
    let $img = this.$(`<img class='boom' src='./img/boom_${isBig ? "big" : "small"}.png'>`)

    position.width = $ene.width()
    position.height = $ene.height()
    $img.css(position)

    this.app.append($img)

    // 添加到页面后 监听css动画的执行，当css动画执行结束时，删除该标签
    // js监听标签的css动画效果，该动画效果会有多个阶段  
    
    $img.fadeTo(250, 0.5).fadeTo(250, 1).fadeTo(250, 0.5).fadeTo(250, 1, () => {
      console.log('动画结束')
    })

  }

}
