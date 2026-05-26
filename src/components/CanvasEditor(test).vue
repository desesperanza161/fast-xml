<template>
<canvas ref="myCanvas" width="400" height="300"></canvas>
</template>

<script>
export default{
    mounted() {
        // здесь ссылка на dom-element
        const canvas = this.$refs.myCanvas;
        // 2d для рисования
        const ctx = canvas.getContext('2d');
        // работа с изображением
        const img= new Image();
        img.src = 'https://placekitten.com/400/300';
             img.onload = () => {
            ctx.drawImage(img, 0,0, canvas.width, canvas.height);
        }
     }
    };
    </script>
