/** Local-space models used by transit systems. */

function buildGondolaPylon(CTX){
  const g = CTX.group();
  const steelMat = CTX.toon('#9DA3A8'), darkMat = CTX.toon('#6E747A');
  g.add(CTX.box(0.55, 0.12, 0.55, darkMat, 0, 0.06, 0));
  g.add(CTX.box(0.4, 0.1, 0.4, steelMat, 0, 0.17, 0));
  g.add(CTX.cyl(0.07, 0.17, 2.5, steelMat, 0, 1.42, 0, 6));
  g.add(CTX.box(0.3, 0.06, 0.3, darkMat, 0, 1.4, 0));
  g.add(CTX.box(0.95, 0.07, 0.12, steelMat, 0, 2.5, 0));
  g.add(CTX.box(0.75, 0.07, 0.12, steelMat, 0, 2.68, 0));
  g.add(CTX.cyl(0.03, 0.03, 0.1, darkMat, -0.45, 2.56, 0, 6));
  g.add(CTX.cyl(0.03, 0.03, 0.1, darkMat,  0.45, 2.56, 0, 6));
  g.add(CTX.cone(0.1, 0.2, steelMat, 0, 2.85, 0, 6));
  return g;
}
function buildGondolaCabin(CTX){
  const g = CTX.group();
  const bodyMat = CTX.toon('#EFEADF'), frameMat = CTX.toon('#9E2B25'), glassMat = CTX.toon('#7FB7C9'), hangMat = CTX.toon('#8A8F94');
  g.add(CTX.box(1.25, 1.25, 1.05, bodyMat, 0, 0, 0));
  g.add(CTX.box(1.33, 0.62, 1.09, glassMat, 0, 0.14, 0));
  g.add(CTX.box(1.40, 0.16, 1.12, frameMat, 0, -0.60, 0));
  g.add(CTX.box(1.40, 0.14, 1.12, frameMat, 0,  0.57, 0));
  [[-0.64,-0.52],[0.64,-0.52],[-0.64,0.52],[0.64,0.52]].forEach(function(p){ g.add(CTX.box(0.08, 1.25, 0.08, frameMat, p[0], 0, p[1])); });
  const roof = CTX.sph(0.70, bodyMat, 0, 0.68, 0, 14); roof.scale.set(1, 0.45, 0.86); g.add(roof);
  g.add(CTX.box(0.08, 0.72, 0.08, hangMat, 0, 0.94, 0));
  g.add(CTX.box(0.22, 0.07, 0.14, hangMat, 0, 1.29, 0));
  return g;
}

export { buildGondolaPylon, buildGondolaCabin };
