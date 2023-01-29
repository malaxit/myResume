    /* макака-код, yes!*/
      //код для отображения блоков-советов при фокусе на инпуты
      for (let prop of ['quantity-input', 'base-select', 'fabric-select', 'fabric-color-select', 'print-size-select', 'print-colors-select', 'fx-select']) {
          document.getElementById(prop).addEventListener('focus', function() {
            document.querySelectorAll('aside div').forEach((item) => {item.style="display:none";});
            document.getElementById(prop + '-tip').style.display = 'inline';
        });
        
      };
    
      //матрица цен, основные коэффициенты, на которых считаются остальные с помощью multiplier.
      let PriceMatrix = {
          12: [2900.00, 4750.00, 6600.00, 8400.00, 10250.00, 12100.00],
          50:[],
          100:[],
          200:[],
          300:[],
          500:[],
          750:[],
          1000:[],
          1500:[],
          2000:[],
          3000:[],
          'unitMinPricePerColor':{1:20.00, 2:29.00, 3:39.00, 4:48.00, 5:58.00, 6:67.00},
          'multiplierPerQuantity': {50:3.75, 100:3, 200:2.75, 300:2.5, 500:2, 750:1.5, 1000:1.25, 1500:1.15, 2000:1.05, 3000:1}
        };
    
        //заполняем остальные коэффициенты в матрице цен
        for (let i = 0; i < 6; i++) {
          for (let prop in PriceMatrix.multiplierPerQuantity) {
            PriceMatrix[prop][i] = (PriceMatrix.unitMinPricePerColor[(i+1)] * PriceMatrix.multiplierPerQuantity[prop]).toFixed(2);
          }
        };
    
      //обработка клика по кнопке 'рассчитать'. считаем заказ.
      document.getElementById('submit').addEventListener('click' , function() {
        if (document.getElementById('quantity-input').value != '') {
          let quantity = document.getElementById('quantity-input').value;
          let numColors = document.getElementById('print-colors-select').value;
          let printBase = document.getElementById('base-select').value;
          let fabric = document.getElementById('fabric-select').value;
          let fabricColor = document.getElementById('fabric-color-select').value;
          let printSize = document.getElementById('print-size-select').value;
          let printFX = Array.from(document.getElementById('fx-select').selectedOptions).map(({ value }) => value);
    
          let pricePerUnit = calculate(quantity, numColors, printBase, fabric, fabricColor, printSize, printFX);
    
          //переписываем выбранные опции в заказ
          document.getElementById('quantity-field').innerHTML = (document.getElementById('quantity-input').value + ' шт.');
          document.getElementById('base-field').innerHTML = document.getElementById('base-select').options[document.getElementById('base-select').selectedIndex].text;
          document.getElementById('fabric-field').innerHTML = document.getElementById('fabric-select').options[document.getElementById('fabric-select').selectedIndex].text;
          document.getElementById('fabric-color-field').innerHTML = document.getElementById('fabric-color-select').options[document.getElementById('fabric-color-select').selectedIndex].text;
          document.getElementById('print-size-field').innerHTML = document.getElementById('print-size-select').options[document.getElementById('print-size-select').selectedIndex].text;
          document.getElementById('print-colors-field').innerHTML = document.getElementById('print-colors-select').options[document.getElementById('print-colors-select').selectedIndex].text;
          if (document.getElementById('fx-select').selectedIndex != -1) {
            document.getElementById('fx-field').innerHTML = Array.from(document.getElementById('fx-select').selectedOptions).map(({ text }) => (' ' + text));
          } else {document.getElementById('fx-field').innerHTML = 'Нет' };
          document.getElementById('ready-psd-field').innerHTML = document.getElementById('ready-psd-select').options[document.getElementById('ready-psd-select').selectedIndex].text;
    
          document.getElementById('pricePerEdition').innerHTML = (pricePerUnit * quantity).toFixed(0) + ' руб.';
          document.getElementById('pricePerUnit').innerHTML = pricePerUnit  + ' руб.';
    
          document.querySelectorAll('aside div').forEach((item) => {item.style="display:none";});
          document.getElementById('calculate-tip').style.display = 'inline';
        } else {
          alert('Количество штук не введено!');
        }
      });
    
      document.getElementById('printBtn').addEventListener('click' , function() {
        var mywindow = window.open('', 'Рассчёт заказа razoom.pro', 'height=400,width=600');
        document.querySelectorAll("button").forEach((item) => {item.style="display:none";});
        mywindow.document.write('<html><head><title>Рассчёт заказа</title>');
        mywindow.document.write('</head><body >');
        mywindow.document.write(document.querySelector("#calculate-tip").outerHTML);
        mywindow.document.write('</body></html>');
        mywindow.document.close(); // necessary for IE >= 10
        mywindow.focus(); // necessary for IE >= 10
        mywindow.print();
        document.querySelectorAll("button").forEach((item) => {item.style="display:inherit";});
        mywindow.close();
      });
    
      document.getElementById('saveToGalleryBtn').addEventListener('click' , function() {
          let style = document.querySelector("#capture").style;
          document.querySelector("#capture").style="background: white; color: black;font-weight: bold;";
          document.querySelectorAll("button").forEach((item) => {item.style="display:none";});
          html2canvas(document.querySelector("#capture")).then(canvas => {
          var dataURL = canvas.toDataURL("image/jpeg");
          var link = document.createElement("a");
          link.href = dataURL;
          link.download = "razoom.pro-OrderCalculation.jpg";
          link.click();
          });
          document.querySelector("#capture").style = style;
          document.querySelectorAll("button").forEach((item) => {item.style="display:inherit";});
      });
      
      function calculate(quantity, numColors, printBase, fabric, fabricColor, printSize, printFX) {
        quantity = Number(quantity);
        let pricePerUnit;
        //три тривиальных случая: меньше 12, больше 3000 и уже посчитанное в pricematrix значение
        if (quantity <= 12) {
          pricePerUnit = (PriceMatrix[12][(numColors-1)]/quantity);
        } else if (quantity >= 3000) {
          pricePerUnit = (PriceMatrix[3000][(numColors-1)]);
        } else if (quantity > 12 && quantity < 3000) {
          let arr = Object.keys(PriceMatrix.multiplierPerQuantity);
          arr.unshift(12); arr = arr.map(Number);
          for (let i = 0; i < arr.length; i++) {
            if (quantity == arr[i]) {
              pricePerUnit = (PriceMatrix[quantity][(numColors-1)]);
            }
            if (quantity > arr[i] && quantity < arr[i+1]) {
            //нетривиальный случай считается по формуле из xls файла, хак для интервала 12-50 т.к. в матрице цен[12] цена не за единицу
              pricePerUnit = ((arr[i]*(arr[i] == 12 ? PriceMatrix[12][(numColors-1)]/12 : PriceMatrix[arr[i]][(numColors-1)]) + (arr[i+1]*PriceMatrix[arr[i+1]][(numColors-1)] - arr[i]*(arr[i] == 12 ? PriceMatrix[12][(numColors-1)]/12 : PriceMatrix[arr[i]][(numColors-1)]))/(arr[i+1] - arr[i])*(quantity - arr[i]))/quantity);
            }
          }
        }
    
        pricePerUnit = pricePerUnit*printBase*fabric*fabricColor*printSize;
        if (printFX.length != 0) {
          for (let fx of printFX) {
            //проверка мультипликатора на один цвет (число), на тираж (*), или плюс фикс. сумма(+)
            if (fx[0] == '*') {
              pricePerUnit = pricePerUnit*(fx.slice(1));
            } else if (fx[0] == '+') {
              pricePerUnit = pricePerUnit+Number(fx.slice(1));
            } else {
              if (Number(numColors) == 1) {pricePerUnit = pricePerUnit*fx}
              else {pricePerUnit = pricePerUnit/numColors*fx + pricePerUnit/numColors*(numColors-1)};
            };
          }
          };
        return pricePerUnit.toFixed(2);
      };