import "./style.css";
import { gsap } from "gsap";

// 角度の差分を求めて「最短角度」で返す
const calcShortAngleDifference = (a1: number, a2: number) => {
   const diff = a1 - a2;
   if (diff > 180) {
      return diff - 360;
   } else if (diff < -180) {
      return diff + 360;
   }   
   return diff;
}

class MouseStalker {
   private static instance: MouseStalker;
   private stalkerObj: {
      isViewd: boolean;
      degree: number; // ストーカー自体の角度
      targetDegree: number; // ストーカーが向かう角度
      stalkerPos: {
         x: number;
         y: number;
      };
      animations: {
         xTo: Function;
         yTo: Function;
         rotate: Function;
      };
   };
   private windowSize: {
      timeoutID: number;
      width: number;
      height: number;
   };

   static init(stalker: HTMLElement) {
      if (this.instance) {
         return this.instance;
      } else {
         this.instance = new MouseStalker(stalker);

         const frame = () => {
            MouseStalker.instance.frame();
            requestAnimationFrame(frame);
         }
         frame();
         
         return this.instance;
      }
   }

   constructor(private stalker: HTMLElement) {
      /********************
		画面のサイズOBJ
		********************/
      this.windowSize = {
         timeoutID: 0,
         width: window.innerWidth,
         height: window.innerHeight,
      };
      window.addEventListener("resize", this.updateWindowSize.bind(this));
      /********************
		ストーカー用OBJ
		********************/
      const easing = { duration: 0.4, ease: "power3.out" };
      this.stalkerObj = {
         isViewd: false,
         degree: 0,
         targetDegree: 0,         
         stalkerPos: {
            x: 0,
            y: 0,
         },
         animations: {
            xTo: gsap.quickTo(this.stalker, "x", easing),
            yTo: gsap.quickTo(this.stalker, "y", easing),
            rotate: (degree: number,targetDegree: number) => {
               // 角度の差分を求めて「最短角度」で返す
               const diff = calcShortAngleDifference(targetDegree,degree);         

               this.stalkerObj.degree += diff / 10;

               // 360度を超えたら、また0度に戻す
               if(this.stalkerObj.degree > 360) {
                  this.stalkerObj.degree -= 360;
               } else if(this.stalkerObj.degree < 0) {
                  this.stalkerObj.degree += 360;
               }                         

               gsap.set(this.stalker, { rotate: degree });
            },
         },
      };
      /********************
		マウスイベント登録
		********************/
      window.addEventListener("mousemove", this.updateStalker.bind(this));
   }
   /*===============================================
	画面サイズを更新する(resize対応)
	===============================================*/
   updateWindowSize() {
      clearTimeout(this.windowSize.timeoutID);
      this.windowSize.timeoutID = setTimeout((id: number) => {
         console.log(this.windowSize.timeoutID);
         this.windowSize.width = window.innerWidth;
         this.windowSize.height = window.innerHeight;
         return id;
      }, 200);
   }
   /*===============================================
	stalkerオブジェクトを更新する
	===============================================*/
   updateStalker({ clientX, clientY }: { clientX: number; clientY: number }) {
      /********************
		中心を0,0にして座標を取得する
		********************/
      const posX = clientX - this.windowSize.width / 2;
      const posY = clientY - this.windowSize.height / 2;
      /********************
		角度を求める
		********************/
      const deltaX = posX - this.stalkerObj.stalkerPos.x;
      const deltaY = posY - this.stalkerObj.stalkerPos.y;
      // 角度を求める前に、マウスが移動したかどうかを確認
      let angleInDegree;
      if (deltaX === 0 && deltaY === 0) {
         // マウスが移動していない場合は、前回の角度をそのまま使用
         angleInDegree = this.stalkerObj.degree;
      } else {
         // マウスが移動した場合は、新しい角度を計算
         const angleInRadian = Math.atan2(deltaY, deltaX);
         angleInDegree = angleInRadian * (180 / Math.PI) + 180; // 0 - 360
      }      

      /********************
		objにセットする
		********************/      
      this.stalkerObj.stalkerPos.x = posX;
      this.stalkerObj.stalkerPos.y = posY;      
      this.stalkerObj.targetDegree = angleInDegree;      
      /********************
		ストーカーにアニメーションを適用する
		********************/
      this.animateStalker();
   }
   /*===============================================
	stalkerにアニメーションを加える
	===============================================*/
   animateStalker() {
      if (!this.stalkerObj.isViewd) {
         this.stalkerObj.isViewd = true;
         //初回はマウス位置にセット+fadeIn
         gsap.set(this.stalker, {
            x: this.stalkerObj.stalkerPos.x,
            y: this.stalkerObj.stalkerPos.y,
         });
         gsap.to(this.stalker, {
            opacity: 1,
         });
         return;
      }
      this.stalkerObj.animations.xTo(this.stalkerObj.stalkerPos.x);
      this.stalkerObj.animations.yTo(this.stalkerObj.stalkerPos.y);      
   }
   frame() {   
      this.stalkerObj.animations.rotate(this.stalkerObj.degree, this.stalkerObj.targetDegree);
   }
}

const target = document.getElementById("js_stalker")!;
MouseStalker.init(target);
