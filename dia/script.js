let materials = []

function OnCheckGroup (inputNode) {
    let cursorTr = inputNode.parentNode.parentNode
    while (!(cursorTr.nextElementSibling.children.length == 1)) {
        cursorTr.nextElementSibling.children[0].getElementsByTagName("input")[0].checked = inputNode.checked
        cursorTr = cursorTr.nextSibling
    }
    return 0
}

class Chart {
    createSvgElement(tagName) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName)
    }

    setAttributes ($svgElement, attributesObject) {
        Object.keys(attributesObject).forEach((key) => {
            $svgElement.setAttribute(key, attributesObject[key])
        })
    }
}

class LineChart extends Chart {
    constructor(data, $container) {
        super()

        this.data = []
        this.$container = $container

        this.maxWidth = this.$container.offsetWidth
        this.maxHeight = this.$container.offsetHeight
    }
    

    getMaterialsOnChange(MyTable) {
        this.data = []
        for ( let elem of MyTable.tBodies[0].rows) {
            if (elem.getElementsByTagName("input")[0].checked) {
                if (!(elem.cells.length == 1)) {
                    this.data.push ({
                        name: elem.cells[0].textContent,
                        density: elem.cells[1].textContent,
                        thermalConductivity: elem.cells[2].textContent,
                        heatCapacity: elem.cells[3].textContent})
                }
            }
        }
        this.clearChart()
        this.create()
    }

    clearChart () {
        this.$container.childNodes.forEach((item) => item.remove())
    }

    onLineOver (line, $svg) {
        const $densityLine = this.createSvgElement('line')
        this.setAttributes($densityLine, {
            x1:0,
            x2:(Number(line.dataset.density)-2),
            y1:(this.maxHeight/2),
            y2:(this.maxHeight/2),
            stroke: 'red',
            'stroke-width':3,
        })
        const $tooltip = document.createElement('div')
        $tooltip.insertAdjacentHTML('afterbegin', line.dataset.text)
        $tooltip.classList.add('tooltip')
        const popperElement = Popper.createPopper(line, $tooltip, {
            placement: 'right',
            modifiers: [
                {
                name: 'offset',
                options: {
                    offset: [10, 20],
                    },
                },
                        ]
        ,})
        line.onmouseout = () => {
            $tooltip.remove()
            $densityLine.remove()
            line.onmouseout = null
          }
        $svg.append($densityLine)
        this.$container.append($tooltip)     
    }

    create() {
        const $svg = this.createSvgElement('svg')
        this.setAttributes($svg, {
            width: '100%',
            height: '100%',
            viewBox: `-22 -22 ${this.maxWidth+140} ${this.maxHeight+40}`,
        })
        
        //хаком задаём стрелки на концах осей
        $svg.insertAdjacentHTML('afterbegin', '<defs><marker id="startarrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="10 0, 10 7, 0 3.5" /></marker><marker id="endarrow" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto" markerUnits="strokeWidth"><polygon points="0 0, 10 3.5, 0 7" /></marker></defs>')

        //считаем максимумы осей и количество материалов
        let arr = {
            density: [],
            thermalConductivity: [],
            heatCapacity: [],
        }

        this.data.forEach((item) => {
            Object.keys(arr).forEach((key) => arr[key].push(!Number(item[key]) ? Math.max(...item[key].match(/(\d+\.*\d*)/g)) : Number(item[key])))
        });

        let MaxDensity = Math.max(...arr.density)
        let MaxthermalConductivity = Math.max(...arr.thermalConductivity)
        let MaxheatCapacity = Math.max(...arr.heatCapacity)
        let MaterialsCount = this.data.length
        
        //отсортировали массив по плотности, вместо простого сравнения ищем максимумы в возможных значениях "ххх...ххх"
        this.data.sort((a, b) => (!Number(a.density) ? Math.max(...a.density.match(/(\d+\.*\d*)/g)) : Number(a.density)) > (!Number(b.density) ? Math.max(...b.density.match(/(\d+\.*\d*)/g)) : Number(b.density)) ? 1 : -1)
        
        //строим оси и легенду
        const $axisXLine = this.createSvgElement('line')
        this.setAttributes($axisXLine, {
            x1:0,
            x2:this.maxWidth,
            y1:(this.maxHeight/2),
            y2:(this.maxHeight/2),
            stroke: 'black',
            'stroke-width':1,
            'marker-end':'url(#endarrow)',
        })

        const $axisYLine = this.createSvgElement('line')
        this.setAttributes($axisYLine, {
            x1:0,
            x2:0,
            y1:0,
            y2:this.maxHeight,
            stroke: 'black',
            'stroke-width':1,
            'marker-start':'url(#startarrow)',
            'marker-end':'url(#endarrow)',
        })
        
        const $axisXtextEnd = this.createSvgElement('text')
        this.setAttributes($axisXtextEnd, {
            x: 5,
            y: this.maxHeight+16,
        })
        $axisXtextEnd.append("Теплоёмкость")

        const $axisXtextStart = this.createSvgElement('text')
        this.setAttributes($axisXtextStart, {
            x: 5,
            y: -10,
        })
        $axisXtextStart.append("Теплопроводность")

        const $axisYtext = this.createSvgElement('text')
        this.setAttributes($axisYtext, {
            x: (this.maxWidth + 16),
            y: (this.maxHeight/2 + 16),
        })
        $axisYtext.append("Плотность")

        $svg.append($axisXLine, $axisYLine, $axisXtextEnd, $axisXtextStart, $axisYtext)

        //рисуем линии
        
        let $RenderedMaterialLines = []
        this.data.forEach((item, index) => {
            let itemDensity = (!Number(item.density) ? Math.max(...item.density.match(/(\d+\.*\d*)/g)) : Number(item.density))
            let itemDensityLevel = itemDensity/MaxDensity*(this.maxWidth-10)

            let $Conductivityline = this.createSvgElement('line')
            let itemthermalConductivity = (!Number(item.thermalConductivity) ? Math.max(...item.thermalConductivity.match(/(\d+\.*\d*)/g)) : Number(item.thermalConductivity))
            let itemthermalConductivityLevel = itemthermalConductivity/MaxthermalConductivity*(this.maxHeight/2)
            itemthermalConductivityLevel = (itemthermalConductivityLevel < 1) ? 3 : itemthermalConductivityLevel
            this.setAttributes($Conductivityline, {
                x1:itemDensityLevel,
                x2:itemDensityLevel,
                y1:(this.maxHeight/2),
                y2:(this.maxHeight/2)-itemthermalConductivityLevel,
                stroke: '#f89330',
                'stroke-width': 4,
            })

            let $Capacityline = this.createSvgElement('line')
            let itemheatCapacity = (!Number(item.heatCapacity) ? Math.max(...item.heatCapacity.match(/(\d+\.*\d*)/g)) : Number(item.heatCapacity))
            let itemheatCapacityLevel = itemheatCapacity/MaxheatCapacity*(this.maxHeight/2)
            itemheatCapacityLevel = (itemheatCapacityLevel < 1) ? 3 : itemheatCapacityLevel
            this.setAttributes($Capacityline, {
                x1:itemDensityLevel,
                x2:itemDensityLevel,
                y1:(this.maxHeight/2),
                y2:(this.maxHeight/2)+itemheatCapacityLevel,
                stroke: '#0000FF',
                'stroke-width': 4,
            })

            $Capacityline.dataset.text = $Conductivityline.dataset.text = `<p>${item.name}\n<p>Плотность: ${item.density}\n<p>Теплопроводность: ${item.thermalConductivity}\n<p>Теплоёмкость: ${item.heatCapacity}`
            $Capacityline.dataset.line = $Conductivityline.dataset.line = 'true'
            $Capacityline.dataset.density = $Conductivityline.dataset.density = itemDensityLevel

            $RenderedMaterialLines.push($Conductivityline, $Capacityline)
        })
        $svg.append(...$RenderedMaterialLines)

        this.$container.append($svg)

        //при наведении дорисовываем плотность и балун с описанием
        $svg.onmouseover = (e) => {
            if (e.target.dataset.line) {
              this.onLineOver(e.target, $svg)
            }
          }


        return this
    }

}
const $chartContainer = document.getElementById('chart')


let lineChart = new LineChart(materials, $chartContainer)
lineChart.getMaterialsOnChange(document.getElementsByTagName('table')[0])


