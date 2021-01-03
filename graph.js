const dims = { height: 300, width: 300, radius: 150};
const cent = {x: (dims.width/2 + 5), y: (dims.height / 2 + 5)};

const svg = d3.select('.canvas')
    .append('svg')
    .attr('width', dims.width + 150)
    .attr('height', dims.height + 150)

const graph = svg.append('g')
    .attr('transform', `translate(${cent.x},${cent.y})`);

const pie = d3.pie()
    .sort(null)
    .value(d => d.cost)



const arcPath = d3.arc()
    .outerRadius(dims.radius)
    .innerRadius(dims.radius/2)

const color = d3.scaleOrdinal(d3['schemeSet3']);

// legend setup
const legendGroup = svg.append('g')
    .attr('transform', `translate(${dims.width + 40}, 10)`)

const legend = d3.legendColor()
    .shape('circle')
    .shapePadding(10)
    .scale(color);

// code for tooltip
const tip = d3
  .select("body")
  .append("div")
  .attr("class", "card")
  .style("padding", "8px") // Add some padding so the tooltip content doesn't touch the border of the tooltip
  .style("position", "absolute") // Absolutely position the tooltip to the body. Later we'll use transform to adjust the position of the tooltip
  .style("left", 0)
  .style("top", 0)
  .style("visibility", "hidden");

    
// update function
const update = (data) => {
    
    // update color scale domain
    color.domain(data.map(d =>  d.name));

    // update and call legend
    legendGroup.call(legend);

    legendGroup.selectAll('text')
        .attr('fill', 'white')



    // join enhanced pide data to path elements
    const paths = graph.selectAll('path')
        .data(pie(data));

    // handle the exit selection
    paths.exit()
        .transition().duration(500)
            .attrTween("d", arcTweenExit)
            .remove()

    // handle the current DOM path updates
    paths.transition().duration(500)
        .attrTween('d', arcTweenUpdate);


    paths.enter()
        .append('path')
        .attr('class', 'arc')
        .attr('stroke', '#fff')
        .attr('stoke-width', 3)
        .attr('fill', d => color(d.data.name))
        .each(function(d){this._current = d})
        .transition().duration(500)
            .attrTween("d", arcTweenEnter)

    // add events
 graph
    .selectAll("path")
    .on("mouseover", (event, d) => {
      let content = `<div class="name">${d.data.name}</div>`;
      content += `<div class="cost">$${d.data.cost}</div>`;
      content += `<div class="delete">Click slice to delete</div>`;
      tip.html(content).style("visibility", "visible");
      handleMouseOver(event, d);
    })
    .on("mouseout", (event, d) => {
      tip.style("visibility", "hidden");
      handleMouseOut(event, d);
    })
    .on("mousemove", (event, d) => {
      tip.style("transform", `translate(${event.pageX}px,${event.pageY}px)`); // We can calculate the mouse's position relative the whole page by using event.pageX and event.pageY.
    })
    .on("click", handleClick);
}
// data array and firestore

var data = [];

db.collection('expenses').onSnapshot(res => {
    res.docChanges().forEach(change => {
        const doc = {...change.doc.data(), id: change.doc.id}

        switch (change.type) {
            case 'added':
                data.push(doc);
                break;
            case 'modified':
            const index = data.findIndex(item => item.id == doc.id);
            data[index] = doc;
            break;
        case 'removed':
            data = data.filter(item => item.id !== doc.id);
            break;
        default:
        break;
    }
    });

    update(data)
})

const arcTweenEnter = (d) => {
    var i = d3.interpolate(d.endAngle, d.startAngle)

    return function (t){
        d.startAngle = i(t)
        return arcPath(d)
    }
}

const arcTweenExit = (d) => {
    var i = d3.interpolate( d.startAngle, d.endAngle)

    return function (t){
        d.startAngle = i(t)
        return arcPath(d)
    }
}

// use function keyword instead of arrow function so we have this
function arcTweenUpdate(d){

    // interpolate between two objects
    var i = d3.interpolate(this._current, d)

    // update current prop with new updated data
    this._current = i(1)
    return function(t){
        
        return arcPath(i(t));
    }

} 

// event handlers
const handleMouseOver = (event, d) => {
  
    d3.select(event.currentTarget)
        .transition('changeSlicFille').duration(300)
        .attr("fill", "#fff");
};

const handleMouseOut = (event, d) => {
  //console.log(event.currentTarget);
  d3.select(event.currentTarget)
    .transition('changeSliceFill').duration(300)
    .attr("fill", color(d.data.name));
};

const handleClick = (event, d) =>{

   const id = d.data.id;
   console.log(id)
   db.collection('expenses').doc(id).delete() 
};