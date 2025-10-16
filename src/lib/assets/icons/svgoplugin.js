// @ts-nocheck

// svgo/convert-dimensions-to-viewbox.js
export default {
  name: 'wh2viewBox',
  type: 'full',
  fn: (ast) => {
    const svg = ast.children.find((node) => node.name === 'svg');
    if (!svg || !svg.attributes) return ast;

    const { width, height, viewBox } = svg.attributes;

    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!isNaN(w) && !isNaN(h)) {
      if (!viewBox) {
        svg.attributes.viewBox = `0 0 ${w} ${h}`;
      }
      delete svg.attributes.width;
      delete svg.attributes.height;
    }

    return ast;
  }
};


// module.exports = {
//   name: 'convertDimensionsToViewBox',
//   type: 'full',
//   fn: (ast) => {
//     const svgElem = ast.children.find((node) => node.name === 'svg');
//     if (!svgElem || !svgElem.attributes) return ast;

//     const { width, height, viewBox } = svgElem.attributes;

//     if (width && height) {
//       const w = parseFloat(width);
//       const h = parseFloat(height);

//       if (!viewBox) {
//         svgElem.attributes.viewBox = `0 0 ${w} ${h}`;
//       }

//       delete svgElem.attributes.width;
//       delete svgElem.attributes.height;
//     }

//     return ast;
//   },
// };
