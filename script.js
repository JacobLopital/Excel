(function() {
    var CELL_WIDTH = 50, // ширина ячейки
        CELL_HEIGHT = 25, // высота ячейки
        num_rows = 50, // y
        num_cols = 40, // x
        range = 10, // область вокруг границы в пикселях, щелчок по которой инициирует передвижение границы 
        values = {}, // значения
        cols = {},
        rows = {},
        dragObject = {},
        changeable_cell = {}, // редактируемая ячейка
        alphabet = [ // массив с алфавитом
            '',
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
            'j',
            'k',
            'l',
            'm',
            'n',
            'o',
            'p',
            'q',
            'r',
            's',
            't',
            'u',
            'v',
            'w',
            'x',
            'y',
            'z'
        ],
        mainTable = createTableSize(num_cols, num_rows); // Создаем таблицу и передаем её в  mainTable

    'use strict';

    //			
    //			
    //			Контроллеры
    //			
    //			


    // обработка щелчка по таблице
    // если td и изменяемый
    // то показываем окошко редактирования
    mainTable.addEventListener("click", function(e) {
        var target = e.target;
        if (target.tagName != 'TD' || ~target.className.indexOf('changeable')) return;
        if (textareaDiv.className == "visible") {
            values[changeable_cell.id] = document.getElementById('textareaElem').value;
            document.getElementById('textareaElem').value = '';
            changeable_cell = {};
        } else {
            textareaDiv.className = "visible";
        }
        fillCells();
        changeable_cell.id = target.id;
        document.getElementById('textareaElem').style.position = 'absolute';
        document.getElementById('textareaElem').style.top = $(target).position().top;
        document.getElementById('textareaElem').style.left = $(target).position().left;
        document.getElementById('textareaElem').style.width = $(target).width() + 2;
        document.getElementById('textareaElem').style.height = $(target).height() + 2;
        document.getElementById('textareaElem').focus();
    });

    // запрещает выделение
    mainTable.addEventListener("selectstart", function(e) {
        return false;
    });

    // запрещает перетаскивание
    mainTable.addEventListener("dragstart", function(e) {
        return false;
    });

    // обработка перетаскивания границы
    // если td и изменяемый
    // записывает в dragObject координаты
    mainTable.addEventListener("mousedown", function(e) {
        var target = e.target; // где был клик?
        if (target.tagName != 'TD' || !target.className.includes('changeable')) return; // не на TD? тогда не интересует

        if (textareaDiv.className == "visible") {
            values[changeable_cell.id] = document.getElementById('textareaElem').value;
            document.getElementById('textareaElem').value = '';
            changeable_cell = {};
            textareaDiv.className = "hidden";
            fillCells();
        }
        if (e.which != 1) { // если клик правой кнопкой мыши
            return; // то он не запускает перенос
        }

        if (target.className.includes('vert')) {
            if (target.clientHeight - e.offsetY < range || e.offsetY < range) {
                if (e.offsetY < range) dragObject.elem = target.parentNode.previousElementSibling.firstChild;
                else dragObject.elem = target;
                dragObject.downX = e.pageX;
                dragObject.downY = e.pageY;
            }
            if (!rows[target.id]) rows[target.id] = CELL_HEIGHT;
        } else {
            if (target.clientWidth - e.offsetX < range || e.offsetX < range) {
                if (e.offsetX < range) dragObject.elem = target.previousElementSibling;
                else dragObject.elem = target;
                dragObject.downX = e.pageX;
                dragObject.downY = e.pageY;
            }
            if (!cols[target.id]) cols[target.id] = CELL_WIDTH;
        }
    });

    // обработка перетаскивания границы
    // когда кнопка отпускается
    // записываем значения и очищаем dragObject
    mainTable.addEventListener("mouseup", function(e) {
        if (!dragObject.elem) return;
        if (dragObject.elem.className.includes('vert')) {
            rows[dragObject.elem.id] = $(dragObject.elem).height();
        } else {
            cols[dragObject.elem.id] = $(dragObject.elem).width();
        }
        dragObject = {};
    });

    // обработка перетаскивания границы
    // по полученным координатам меняем размер ячеек
    window.addEventListener("mousemove", function(e) {
        let elem = e.target.closest('.changeable');
        if (elem) {
            if (!elem.className.includes('vert') && (getCoords(elem).left + elem.offsetWidth - e.pageX < range || e.pageX - getCoords(elem).left < range)) elem.style.cursor = 'col-resize';
            else if (elem.className.includes('vert') && (getCoords(elem).top + elem.offsetHeight - e.pageY < range || e.pageY - getCoords(elem).top < range)) elem.style.cursor = 'row-resize';
            else elem.style.cursor = 'default';
        }
        if (!dragObject.elem) return; // элемент не зажат
        textareaDiv.className = "hidden";
        var moveX = e.pageX - dragObject.downX;
        var moveY = e.pageY - dragObject.downY;
        if (~dragObject.elem.className.indexOf('vert')) {
            dragObject.elem.style.height = rows[dragObject.elem.id] + moveY + 'px';
            if (elem) elem.style.cursor = 'row-resize';
        } else {
            dragObject.elem.style.minWidth = cols[dragObject.elem.id] + moveX + 'px';
            if (elem) elem.style.cursor = 'col-resize';
        }

    });

    // обработка скролла
    // если пересекли значение в ширину/высоту ячейки, 
    // то рисуем еще 3
    window.addEventListener("scroll", function() {
        if (document.documentElement.scrollHeight - window.pageYOffset < document.body.clientHeight + CELL_HEIGHT) addNewTr(3);
        if (document.documentElement.scrollWidth - window.pageXOffset < document.body.clientWidth + CELL_WIDTH) addNewTd(3);
    });

    //			
    //			
    //			Вспомогательные функции
    //			
    //			
	
	// Возвращает координаты элемента
    function getCoords(elem) { // кроме IE8-
        var box = elem.getBoundingClientRect();
        return {
            top: box.top + pageYOffset,
            left: box.left + pageXOffset
        };
    }
    // возвращает количество разрядов числа в системе исчисления равной длине алфавита
    function getBitNum(a, b, log) {
        if (Math.floor(a / b) !== 0) {
            log++;
            return getBitNum(Math.floor(a / b), b, log)
        }
        return log;
    }

    // тут вычисляется, какие буквы будут написаны
    // с помошью функции getBitNum (подсказывает количество проходов) по очереди выясняется каждый разряд
    // и в конце добавляется оставшееся число.
    // в десятичной системе это выглядело бы так:
    // num = 148;
    // letter+=Math.floor(num/100);
    // num = 148 - 1*100;
    // letter+=Math.floor(num/10);
    // num = 48 - 4*10;
    // letter+=num; 
    // letter==148; //true
    function getLetter(num) {
        var letter = '';
        for (var i = getBitNum(num, alphabet.length - 1, 0); i > 0; i--) {
            aaa = Math.floor(num / ((alphabet.length - 1) * i))
            letter += alphabet[aaa];
            num = num - (alphabet.length - 1) * aaa;
        }
        letter += alphabet[num + 1];
        return letter;
    }

    // заполняет ячейки значениями
    function fillCells() {
        for (i in values) {
            document.getElementById(i).innerHTML = values[i];
        }
    }

    // заполняет ячейки нумерацией
    function createNumeration() {
        for (var i = 1; i <= num_cols; i++) {
            $('#' + i + '_0').text(getLetter(i - 1));
        }
        for (var i = 1; i <= num_rows; i++) {
            $('#0_' + i).text(i);
        }
    }

    //			
    //			
    //			Функции работы с таблицами
    //			
    //			

    // создает таблицу с указанным значением
    function createTableSize(x, y) {
        var new_table = document.createElement('table');
        new_table.id = 'mainTable'
        new_table.cellspacing = '0';
        new_table.cellpadding = '0';
        new_table.tableLayout = 'fixed';
        new_table.appendChild(createTr(x, 0));
        for (var i = 1; i < y + 1; i++) { // заполняем таблицу значениями
            new_table.appendChild(createTr(x, i));
        }
        document.getElementById('divTable').appendChild(new_table);
        createNumeration();
        return document.getElementById('mainTable');
    }

    // создает строку
    function createTr(x, y) {
        var new_tr = document.createElement('tr');
        new_tr.id = 'tr' + y;
        for (var i = 0; i <= x; i++) {
            new_tr.appendChild(createTd(i, y))
        }
        return new_tr;
    }

    // создает ячейку
    function createTd(x, y) {
        var new_td = document.createElement('td');
        new_td.style.minWidth = CELL_WIDTH;
        new_td.style.width = CELL_WIDTH;
        new_td.contenteditable = true;
        new_td.id = x + '_' + y;
        if (x === 0) new_td.className = 'noselect vert changeable';
        if (y === 0) new_td.className = 'changeable';
        return new_td;
    }

    // добавляет новые строки к уже имеющейся таблице
    function addNewTr(num) {
        for (var i = 1; i <= num; i++) {
            numb = i + num_rows;
            document.getElementById('mainTable').appendChild(createTr(num_cols, numb));
        }
        num_rows += num;
        createNumeration();
    }

    // добавляет новые столбцы к уже имеющейся таблице
    function addNewTd(num) {
        for (var i = 0; i <= num_rows; i++) {
            for (var j = 1; j <= num; j++) {
                document.getElementById('tr' + i).appendChild(createTd(num_cols + j, i));
            }
        }
        num_cols += num;
        createNumeration();
    }
})();