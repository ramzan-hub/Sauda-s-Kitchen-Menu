'use strict';

// Menu names, prices and descriptions stay unchanged. Callouts identify visible
// components after reviewing the original photographs, not a verified recipe.
// Anchors are percentages (0–100) of the ORIGINAL image, including transparency.
// Hidden spices and uncertain ingredients intentionally have no connector.
const component = (label, x, y) => ({ label, anchor: { x, y }, visuallyReviewed: true });
const ingredientAnnotations = {
  'chicken-biryani.png': [component('Basmati rice', 43, 86), component('Spiced chicken', 48, 43), component('Fresh herbs', 50, 51)],
  'pattiri-chicken-curry.png': [component('Rice pattiri', 32, 42), component('Chicken', 70, 51), component('Curry gravy', 79, 61)],
  'porotta-beef.png': [component('Layered porotta', 35, 48), component('Beef', 69, 45)],
  'puttu-kadala.png': [component('Steamed puttu', 43, 62), component('Black chickpeas', 73, 42), component('Fresh herbs', 77, 55)],
  'Chappati-veg-curry.png': [component('Whole-wheat chapati', 31, 50), component('Mixed vegetables', 69, 48), component('Fresh herbs', 72, 51)],
  'idli-sambar.png': [component('Steamed idli', 29, 33), component('Lentil sambar', 66, 29), component('White chutney', 78, 65)],
  'ghee-rice-beef.png': [component('Ghee rice', 22, 69), component('Beef', 78, 37), component('Fried onions', 32, 66)],
  'poori-bhaji.png': [component('Golden poori', 33, 46), component('Potato bhaji', 74, 55), component('Fresh herbs', 68, 50)],
  'masala-dosa.png': [component('Crispy dosa', 52, 48), component('Potato masala', 52, 77), component('White chutney', 16, 49), component('Sambar', 79, 30)],
  'kappa-beef.png': [component('Tapioca', 36, 37), component('Beef', 69, 61)]
};
const menu = [
  { name: 'Chicken Biryani', price: 22, image: 'chicken-biryani.png', category: 'SIGNATURE', description: 'Fragrant basmati rice layered with tender spiced chicken, aromatic herbs, and warming spices.', ingredients: ingredientAnnotations['chicken-biryani.png'] },
  { name: 'Pattiri and Chicken Curry', price: 18, image: 'pattiri-chicken-curry.png', category: 'KERALA SPECIAL', description: 'Delicate rice flatbreads served with rich, Kerala-style chicken curry.', ingredients: ingredientAnnotations['pattiri-chicken-curry.png'] },
  { name: 'Porotta and Beef', price: 20, image: 'porotta-beef.png', category: 'KERALA SPECIAL', description: 'Flaky, layered Kerala porotta paired with tender beef in a deeply spiced gravy.', ingredients: ingredientAnnotations['porotta-beef.png'] },
  { name: 'Puttu and Kadala', price: 14, image: 'puttu-kadala.png', category: 'TRADITIONAL', description: 'Soft steamed rice cakes served with hearty black chickpea curry.', ingredients: ingredientAnnotations['puttu-kadala.png'] },
  { name: 'Chapati and Veg Curry', price: 15, image: 'Chappati-veg-curry.png', category: 'VEGETARIAN', description: 'Fresh, tender whole-wheat flatbreads accompanied by a comforting vegetable curry.', ingredients: ingredientAnnotations['Chappati-veg-curry.png'] },
  { name: 'Idli with Sambar and Chutney', price: 12, image: 'idli-sambar.png', category: 'SOUTH INDIAN', description: 'Pillowy steamed rice cakes served with aromatic lentil sambar and traditional chutney.', ingredients: ingredientAnnotations['idli-sambar.png'] },
  { name: 'Ghee Rice and Beef Curry', price: 24, image: 'ghee-rice-beef.png', category: 'SIGNATURE', description: 'Fragrant, ghee-infused rice paired with slow-cooked, richly spiced beef curry.', ingredients: ingredientAnnotations['ghee-rice-beef.png'] },
  { name: 'Poori Bhaji', price: 12, image: 'poori-bhaji.png', category: 'VEGETARIAN', description: 'Golden, puffed wheat breads served with a warmly spiced potato preparation.', ingredients: ingredientAnnotations['poori-bhaji.png'] },
  { name: 'Masala Dosa', price: 16, image: 'masala-dosa.png', category: 'SOUTH INDIAN', description: 'A crisp, golden dosa filled with seasoned potatoes, accompanied by sambar and colorful chutneys.', ingredients: ingredientAnnotations['masala-dosa.png'] },
  { name: 'Kappa and Beef', price: 22, image: 'kappa-beef.png', category: 'KERALA SPECIAL', description: 'Tender Kerala-style tapioca paired with robust, spice-rich beef curry.', ingredients: ingredientAnnotations['kappa-beef.png'] }
];

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = window.matchMedia('(max-width: 900px)');
const stage = document.querySelector('#plate-stage');
const slots = [...document.querySelectorAll('.plate-slot')];
const copy = document.querySelector('.dish-copy');
const list = document.querySelector('#dish-list');
const status = document.querySelector('#dish-status');
let activeIndex = 0;
let activeSlot = 0;
let transitioning = false;
let pendingNavigation = null;
let transitionTarget = null;
let runningAnimations = [];
const wrap = index => (index + menu.length) % menu.length;
const pad = number => String(number).padStart(2, '0');
const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let plateHovered = false;
let ingredientsOpen = false;
let ingredientsPinned = false;
let annotationGeneration = 0;
let ingredientTouchMode = false;
let selectedHotspot = null;
let hotspotPoints = [];
let hotspotLabelAnimation = null;
const mobileIngredientMode = () => mobileLayout.matches || !desktopPointer.matches || ingredientTouchMode;

// One persistent ambient animation per image, explicitly started at load.
// Hiding/reusing a slot never recreates its animation or resets its angle.
// Wrapper transforms are completely independent of these image transforms.
const rotations = slots.map(slot => {
  const rotation = slot.querySelector('img').animate(
    [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
    { duration: 30000, iterations: Infinity, easing: 'linear' }
  );
  rotation.id = 'ambient-plate-rotation';
  return rotation;
});
function syncRotations() {
  const hoverPaused = desktopPointer.matches && !mobileLayout.matches && plateHovered;
  rotations.forEach((rotation, i) => {
    const paused = document.hidden || motionPreference.matches || slots[i].hidden || transitioning || hoverPaused || ingredientsOpen;
    if (paused && rotation.playState !== 'paused') rotation.pause();
    else if (!paused && rotation.playState !== 'running') rotation.play();
  });
}
// Use actual mouse movement instead of CSS :hover, which can be sticky on touch
// devices and can already match at load before the visitor has interacted.
stage.addEventListener('pointermove', event => {
  if (event.pointerType === 'mouse' && desktopPointer.matches && !mobileLayout.matches && ingredientTouchMode) {
    hideIngredients(true);
    ingredientTouchMode = false;
    updateIngredientMode();
  }
  if (event.pointerType === 'mouse' && desktopPointer.matches && !mobileLayout.matches && !plateHovered) {
    plateHovered = true;
    syncRotations();
    if (!transitioning) showIngredients();
  }
});
stage.addEventListener('pointerleave', () => {
  plateHovered = false;
  if (!ingredientsPinned) hideIngredients();
  syncRotations();
});
syncRotations();
const rollAngles = [0, 0];
const main = document.querySelector('.menu-experience');
const ingredientLayer = document.querySelector('#ingredient-layer');
const ingredientPanel = document.querySelector('#ingredient-panel');
const ingredientList = document.querySelector('#ingredient-list');
const ingredientToggle = document.querySelector('#ingredients-toggle');
const hotspotLayer = document.querySelector('#mobile-ingredient-hotspots');
const hotspotLabel = document.querySelector('#hotspot-label');

function updateIngredientMode() {
  document.body.classList.toggle('mobile-ingredients', mobileIngredientMode());
  ingredientToggle.setAttribute('aria-controls', mobileIngredientMode() ? 'mobile-ingredient-hotspots' : 'ingredient-panel');
}
updateIngredientMode();
// A hybrid tablet follows the actual input used in the ingredient region.
// Mouse input returns to the original hover interaction; touch uses hotspots.
document.addEventListener('pointerdown', event => {
  if ((event.pointerType === 'touch' || event.pointerType === 'pen') && event.target.closest('#plate-stage,#ingredients-toggle') && !ingredientTouchMode) {
    if (ingredientsOpen && !mobileIngredientMode()) hideIngredients(true);
    ingredientTouchMode = true;
    plateHovered = false;
    updateIngredientMode();
    syncRotations();
  }
}, { capture: true, passive: true });

// Mobile positions reuse the reviewed original-image anchors. Both the paused
// image rotation and retained rolling-wrapper angle are included, keeping
// buttons and the single upright label independent of either transform layer.
function renderMobileHotspots() {
  if (!ingredientsOpen || !mobileIngredientMode() || transitioning) return;
  const slot = slots[activeSlot];
  const image = slot.querySelector('img');
  if (!image.naturalWidth) return;
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const matrix = new DOMMatrix(getComputedStyle(slot).transform).multiply(new DOMMatrix(getComputedStyle(image).transform));
  hotspotPoints = menu[activeIndex].ingredients.filter(item => item.anchor).map(item => {
    const point = new DOMPoint((item.anchor.x / 100 - .5) * image.naturalWidth * scale, (item.anchor.y / 100 - .5) * image.naturalHeight * scale).matrixTransform(matrix);
    return { ...item, x: width / 2 + point.x, y: height / 2 + point.y };
  });
  hotspotLayer.replaceChildren(...hotspotPoints.map((point, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ingredient-hotspot';
    button.style.left = `${point.x}px`;
    button.style.top = `${point.y}px`;
    button.dataset.index = index;
    button.dataset.sourceX = point.anchor.x;
    button.dataset.sourceY = point.anchor.y;
    button.setAttribute('aria-label', point.label);
    button.setAttribute('aria-pressed', String(index === selectedHotspot));
    button.addEventListener('click', event => {
      if (!ingredientsOpen || !mobileIngredientMode()) return;
      // Invisible 44px targets can overlap on small plates. Pointer taps select
      // the nearest visible marker; keyboard activation selects its own button.
      let target = index;
      if (event.detail > 0) {
        const rect = stage.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        target = hotspotPoints.reduce((nearest, item, i) => (item.x - x) ** 2 + (item.y - y) ** 2 < (hotspotPoints[nearest].x - x) ** 2 + (hotspotPoints[nearest].y - y) ** 2 ? i : nearest, 0);
      }
      selectHotspot(target);
    });
    return button;
  }));
  hotspotLayer.inert = false;
  hotspotLayer.setAttribute('aria-hidden', 'false');
  // One-off frame commits the small scale/opacity entrance; no animation loop.
  const generation = annotationGeneration;
  requestAnimationFrame(() => {
    if (ingredientsOpen && generation === annotationGeneration) hotspotLayer.classList.add('is-visible');
  });
}
function selectHotspot(index) {
  selectedHotspot = selectedHotspot === index ? null : index;
  hotspotLayer.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === selectedHotspot)));
  hotspotLabelAnimation?.cancel();
  hotspotLabelAnimation = null;
  hotspotLabel.textContent = selectedHotspot === null ? '' : hotspotPoints[selectedHotspot].label;
  hotspotLabel.hidden = selectedHotspot === null;
  if (selectedHotspot !== null && !motionPreference.matches) {
    hotspotLabelAnimation = hotspotLabel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
  }
}

// Map original-image coordinates through contain-fit bounds AND both transform
// layers. Ambient rotation is frozen at its current angle, never reset to zero.
// Reads happen together, followed by one SVG update; there is no render loop.
function renderAnnotations() {
  if (!ingredientsOpen || mobileLayout.matches || transitioning) return;
  const slot = slots[activeSlot];
  const image = slot.querySelector('img');
  if (!image.naturalWidth) return;
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const fitWidth = image.naturalWidth * scale;
  const fitHeight = image.naturalHeight * scale;
  const matrix = new DOMMatrix(getComputedStyle(slot).transform).multiply(new DOMMatrix(getComputedStyle(image).transform));
  const points = menu[activeIndex].ingredients.filter(item => item.anchor).map(item => {
    const local = new DOMPoint((item.anchor.x / 100 - .5) * fitWidth, (item.anchor.y / 100 - .5) * fitHeight);
    const transformed = local.matrixTransform(matrix);
    return { ...item, x: transformed.x + width / 2, y: transformed.y + height / 2 };
  });
  // Assign labels to the nearest distinct corner to shorten connectors and
  // reduce crossing, even when the paused plate has rolled to a new orientation.
  const corners = [{ x: 12, y: 16, side: 'left' }, { x: width - 12, y: 16, side: 'right' }, { x: 12, y: height - 14, side: 'left' }, { x: width - 12, y: height - 14, side: 'right' }];
  let best = [];
  let bestCost = Infinity;
  function assign(chosen, remaining, cost) {
    if (chosen.length === points.length) {
      if (cost < bestCost) { best = chosen; bestCost = cost; }
      return;
    }
    const point = points[chosen.length];
    remaining.forEach((corner, index) => assign([...chosen, corner], remaining.filter((_, i) => i !== index), cost + (point.x - corner.x) ** 2 + (point.y - corner.y) ** 2));
  }
  assign([], corners, 0);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('aria-hidden', 'true');
  const node = (type, attributes) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', type);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  };
  points.forEach((point, index) => {
    const corner = best[index];
    const labelWidth = Math.min(point.label.length * 5.7, width * .4);
    const endX = corner.x + (corner.side === 'left' ? labelWidth + 5 : -labelWidth - 5);
    const endY = corner.y + 7;
    const elbowX = corner.side === 'left' ? Math.min(endX + 12, width / 2) : Math.max(endX - 12, width / 2);
    svg.append(node('path', { d: `M ${endX} ${endY} L ${elbowX} ${endY} L ${point.x} ${point.y}`, class: 'ingredient-connector', pathLength: 1 }));
    svg.append(node('circle', { cx: point.x, cy: point.y, r: 1.7, class: 'ingredient-anchor', 'data-label': point.label, 'data-source-x': point.anchor.x, 'data-source-y': point.anchor.y }));
    const label = node('text', { x: corner.x, y: corner.y, 'text-anchor': corner.side === 'left' ? 'start' : 'end', class: 'ingredient-label' });
    label.textContent = point.label;
    svg.append(label);
  });
  ingredientLayer.replaceChildren(svg);
  ingredientLayer.classList.add('is-visible');
}
function showIngredients(pinned = false) {
  if (transitioning || document.querySelector('#contact-dialog').open) return;
  ingredientsPinned = pinned || ingredientsPinned;
  ingredientsOpen = true;
  document.body.classList.add('ingredients-open');
  ingredientPanel.hidden = mobileIngredientMode();
  ingredientToggle.setAttribute('aria-expanded', 'true');
  ingredientToggle.textContent = mobileIngredientMode() ? 'CLOSE' : 'CLOSE INGREDIENTS';
  selectedHotspot = null;
  hotspotLabel.textContent = '';
  hotspotLabel.hidden = true;
  if (!mobileIngredientMode()) ingredientList.replaceChildren(...menu[activeIndex].ingredients.map(item => {
    const li = document.createElement('li');
    li.textContent = item.label;
    return li;
  }));
  syncRotations();
  const generation = ++annotationGeneration;
  // WAAPI pause is asynchronous; wait for its rendering commit before reading
  // the frozen transform. Two one-off frames are not a continuous animation loop.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (ingredientsOpen && generation === annotationGeneration) {
      if (mobileIngredientMode()) renderMobileHotspots();
      else renderAnnotations();
    }
  }));
}
function hideIngredients(immediate = false) {
  ingredientsOpen = false;
  ingredientsPinned = false;
  annotationGeneration++;
  document.body.classList.remove('ingredients-open');
  ingredientLayer.classList.remove('is-visible');
  if (immediate) ingredientLayer.replaceChildren();
  ingredientPanel.hidden = true;
  hotspotLayer.classList.remove('is-visible');
  hotspotLayer.inert = true;
  hotspotLayer.setAttribute('aria-hidden', 'true');
  if (immediate) hotspotLayer.replaceChildren();
  selectedHotspot = null;
  hotspotLabelAnimation?.cancel();
  hotspotLabelAnimation = null;
  hotspotLabel.textContent = '';
  hotspotLabel.hidden = true;
  ingredientToggle.setAttribute('aria-expanded', 'false');
  ingredientToggle.textContent = 'EXPLORE INGREDIENTS';
  syncRotations();
}
ingredientToggle.addEventListener('click', () => ingredientsOpen ? hideIngredients() : showIngredients(true));
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && ingredientsOpen) hideIngredients();
});
new ResizeObserver(() => {
  if (ingredientsOpen) {
    if (mobileIngredientMode()) renderMobileHotspots();
    else if (!mobileLayout.matches) renderAnnotations();
  }
}).observe(stage);


// Construct the navigation once. Small derived thumbnails keep the dish index
// from downloading all ten full-resolution photographs on initial load.
const buttons = menu.map((dish, index) => {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.className = 'dish-button';
  button.type = 'button';
  button.setAttribute('aria-label', `${dish.name}, ${dish.price} SAR`);
  button.setAttribute('aria-current', String(index === 0));
  const thumb = document.createElement('img');
  thumb.className = 'dish-thumb';
  thumb.src = `assets/thumbnails/${dish.image.replace('.png', '.webp')}`;
  thumb.alt = '';
  thumb.width = 43;
  thumb.height = 43;
  thumb.decoding = 'async';
  const name = document.createElement('span');
  name.className = 'dish-label';
  name.textContent = dish.name;
  const cost = document.createElement('span');
  cost.className = 'dish-cost';
  cost.append(String(dish.price));
  const currency = document.createElement('small');
  currency.textContent = 'SAR';
  cost.append(currency);
  button.append(thumb, name, cost);
  button.addEventListener('click', () => navigate(index));
  item.append(button);
  list.append(item);
  return button;
});

// Keep decoded high-resolution images for the active dish and its neighbors,
// instead of retaining all ten decoded photographs on a mobile device.
// An asset error leaves the current dish intact.
const imageCache = new Map();
function displaySource(index) {
  const filename = menu[index].image;
  return mobileLayout.matches ? `assets/display/${filename.replace('.png', '.webp')}` : `images/${filename}`;
}
function loadDish(index) {
  const key = displaySource(index);
  if (!imageCache.has(key)) {
    const image = new Image();
    image.src = key;
    const promise = image.decode().then(() => image).catch(error => {
      imageCache.delete(key);
      throw error;
    });
    imageCache.set(key, promise);
  }
  return imageCache.get(key);
}
function loadNeighbors() {
  const nearby = [activeIndex, wrap(activeIndex - 1), wrap(activeIndex + 1)];
  const keep = new Set([...nearby, transitionTarget, pendingNavigation?.index].filter(index => index != null).map(displaySource));
  for (const key of imageCache.keys()) if (!keep.has(key)) imageCache.delete(key);
  nearby.filter(index => index !== activeIndex).forEach(index => loadDish(index).catch(() => {}));
}
function updateDish(index) {
  const dish = menu[index];
  document.querySelector('#dish-name').textContent = dish.name;
  document.querySelector('#dish-name').classList.toggle('long-title', dish.name.length > 20);
  document.querySelector('#dish-description').textContent = dish.description;
  document.querySelector('#dish-price').textContent = dish.price;
  document.querySelector('#dish-category').textContent = dish.category;
  document.querySelector('#dish-number').textContent = pad(index + 1);
  document.querySelector('.nav-heading > span:last-child').textContent = `${pad(index + 1)} / 10`;
  buttons.forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
  // Annotation architecture: expose the current dish without fabricated labels.
  document.querySelector('#ingredient-layer').dataset.dishIndex = index;
  status.textContent = `${dish.name}, ${dish.price} SAR. Dish ${index + 1} of ${menu.length}.`;
  if (mobileLayout.matches) {
    const item = buttons[index].parentElement;
    const left = item.offsetLeft - (list.clientWidth - item.clientWidth) / 2;
    list.scrollTo({ left, behavior: motionPreference.matches ? 'instant' : 'smooth' });
  }
}
function animate(element, frames, options) {
  // A preference change can happen between awaits inside a transition.
  if (motionPreference.matches) return Promise.resolve();
  const animation = element.animate(frames, options);
  runningAnimations.push(animation);
  return animation.finished.catch(() => {});
}

// Roll a physical distance using angle = distance / plate radius, with identical
// easing for translation and rotation. Retain the ending wrapper angle before
// cancelling finished effects, so cleanup never snaps the photograph to zero.
// No opacity fades or scaling are used on either plate.
async function navigate(index, direction) {
  index = wrap(index);
  if (transitioning) { pendingNavigation = { index, direction }; return; }
  if (index === activeIndex) return;
  hideIngredients(true);
  plateHovered = false;
  transitioning = true;
  ingredientToggle.disabled = true;
  transitionTarget = index;
  const previousIndex = activeIndex;
  const outgoingSlot = activeSlot;
  const incomingSlot = 1 - activeSlot;
  const outgoing = slots[outgoingSlot];
  const incoming = slots[incomingSlot];
  let committed = false;
  try {
    const image = await loadDish(index);
    const incomingImage = incoming.querySelector('img');
    incoming.querySelector('source').srcset = `assets/display/${menu[index].image.replace('.png', '.webp')}`;
    incomingImage.src = `images/${menu[index].image}`;
    incomingImage.alt = menu[index].name;
    await incomingImage.decode();
    const forwardSteps = wrap(index - activeIndex);
    const backwardSteps = wrap(activeIndex - index);
    const sign = direction ?? (forwardSteps <= backwardSteps ? 1 : -1);
    const rect = stage.getBoundingClientRect();
    // Entire plates enter/exit beyond viewport edges, never a square hero crop.
    const distance = Math.max(rect.right, document.documentElement.clientWidth - rect.left) + 32;
    const roll = distance / (stage.clientWidth / 2) * 180 / Math.PI;
    const outgoingAngle = rollAngles[outgoingSlot];
    const incomingStart = rollAngles[incomingSlot];
    const incomingEnd = incomingStart - sign * roll;
    const transform = (x, angle) => `translate3d(${x}px, 0, 0) rotate(${angle}deg)`;
    const commitDish = () => {
      if (committed) return;
      committed = true;
      activeIndex = index;
      activeSlot = incomingSlot;
      outgoing.setAttribute('aria-hidden', 'true');
      incoming.removeAttribute('aria-hidden');
      updateDish(index);
    };
    if (motionPreference.matches) {
      incoming.hidden = false;
      commitDish();
    } else {
      // Set the offscreen starting pose before revealing the incoming image.
      incoming.style.transform = transform(sign * distance, incomingStart);
      incoming.hidden = false;
      incoming.setAttribute('aria-hidden', 'true');
      stage.classList.add('is-transitioning');
      main.setAttribute('aria-busy', 'true');
      syncRotations();
      const duration = mobileLayout.matches ? 680 : 1050;
      const options = { duration, easing: 'cubic-bezier(.45,0,.16,1)', fill: 'forwards' };
      const platePromises = [
        animate(outgoing, [{ transform: transform(0, outgoingAngle) }, { transform: transform(-sign * distance, outgoingAngle - sign * roll) }], options),
        animate(incoming, [{ transform: transform(sign * distance, incomingStart) }, { transform: transform(0, incomingEnd) }], options)
      ];
      // Stagger text exit and entry without timers. The indicator and selected
      // item change once the incoming photograph becomes the visual focus.
      await animate(copy, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: mobileLayout.matches ? 120 : 220, delay: mobileLayout.matches ? 80 : 180, fill: 'forwards', easing: 'ease-in' });
      // Persist a hidden text pose before clearing its finished animation.
      copy.style.opacity = '0';
      commitDish();
      await Promise.all([
        ...platePromises,
        animate(copy, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: mobileLayout.matches ? 300 : 460, delay: mobileLayout.matches ? 30 : 70, fill: 'forwards', easing: 'cubic-bezier(.2,.7,.2,1)' })
      ]);
      rollAngles[incomingSlot] = incomingEnd % 360;
      incoming.style.transform = transform(0, rollAngles[incomingSlot]);
    }
    outgoing.hidden = true;
    outgoing.setAttribute('aria-hidden', 'true');
    loadNeighbors();
  } catch (error) {
    activeIndex = previousIndex;
    activeSlot = outgoingSlot;
    if (committed) updateDish(previousIndex);
    incoming.hidden = true;
    outgoing.hidden = false;
    outgoing.removeAttribute('aria-hidden');
    status.textContent = `Unable to display ${menu[index].name}. Its image could not be loaded.`;
    console.error(`Dish image failed: ${menu[index].image}`, error);
  } finally {
    // Only short-lived transition effects are cancelled. Ambient rotations live
    // for the page lifetime and keep their currentTime when paused or resumed.
    runningAnimations.forEach(animation => animation.cancel());
    runningAnimations = [];
    copy.style.removeProperty('opacity');
    stage.classList.remove('is-transitioning');
    main.removeAttribute('aria-busy');
    transitioning = false;
    ingredientToggle.disabled = false;
    transitionTarget = null;
    syncRotations();
    const queued = pendingNavigation;
    pendingNavigation = null;
    if (queued && queued.index !== activeIndex) navigate(queued.index, queued.direction);
  }
}

function step(direction) {
  // Relative gestures use the queued destination or in-flight destination as
  // their base, preserving direction even across dish 10 → 1 and rapid input.
  const base = pendingNavigation?.index ?? transitionTarget ?? activeIndex;
  navigate(wrap(base + direction), direction);
}
document.querySelector('#previous').addEventListener('click', () => step(-1));
document.querySelector('#next').addEventListener('click', () => step(1));
window.addEventListener('keydown', event => {
  if (document.querySelector('#contact-dialog').open) return;
  if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  }
});

// Desktop wheel gestures need both an animation lock and a quiet period, so a
// trackpad's inertial tail cannot advance a second dish. Mobile scroll is native.
let wheelTotal = 0;
let lastWheel = 0;
let wheelConsumed = false;
window.addEventListener('wheel', event => {
  if (document.querySelector('#contact-dialog').open || mobileLayout.matches || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  const now = performance.now();
  if (now - lastWheel > 220) { wheelTotal = 0; wheelConsumed = false; }
  lastWheel = now;
  event.preventDefault();
  if (transitioning || wheelConsumed) return;
  wheelTotal += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
  if (Math.abs(wheelTotal) >= 35) {
    wheelConsumed = true;
    step(wheelTotal > 0 ? 1 : -1);
  }
}, { passive: false });

// One Pointer Events recognizer; no parallel touch listeners or double dispatch.
// Native pan-y scrolling is retained. A horizontal gesture reacts on movement,
// not only release, and emits at most one navigation request per pointer contact.
// While rolling, repeated swipes replace ONE queued intent relative to the
// in-flight destination, instead of discarding input or building a long backlog.
let gesture = null;
const touchPointers = new Set();
function requestSwipe(direction) {
  const base = transitionTarget ?? activeIndex;
  navigate(wrap(base + direction), direction);
}
function recognizeSwipe(event, releasing = false) {
  if (ingredientsOpen && mobileIngredientMode()) return;
  if (!gesture || event.pointerId !== gesture.id || gesture.consumed || gesture.vertical) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  const elapsed = Math.max(1, event.timeStamp - gesture.time);
  const distance = Math.abs(dx);
  if (Math.abs(dy) > 12 && Math.abs(dy) > distance * 1.15) { gesture.vertical = true; return; }
  const threshold = Math.max(30, Math.min(42, stage.clientWidth * .11));
  const fastFlick = releasing && distance >= 20 && elapsed <= 220 && distance / elapsed >= .45;
  if ((distance >= threshold || fastFlick) && distance > Math.abs(dy) * 1.35) {
    gesture.consumed = true;
    requestSwipe(dx < 0 ? 1 : -1);
  }
}
stage.addEventListener('pointerdown', event => {
  if ((ingredientsOpen && mobileIngredientMode()) || event.pointerType === 'mouse' || event.target.closest('button,a') || document.querySelector('#contact-dialog').open) return;
  touchPointers.add(event.pointerId);
  if (touchPointers.size > 1) { gesture = null; return; }
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, consumed: false, vertical: false };
  // Synthetic regression events have no active capture target in the browser.
  if (event.isTrusted) stage.setPointerCapture?.(event.pointerId);
}, { passive: true });
stage.addEventListener('pointermove', event => recognizeSwipe(event), { passive: true });
stage.addEventListener('pointerup', event => {
  recognizeSwipe(event, true);
  touchPointers.delete(event.pointerId);
  if (gesture?.id === event.pointerId) gesture = null;
}, { passive: true });
stage.addEventListener('pointercancel', event => {
  touchPointers.delete(event.pointerId);
  gesture = null;
}, { passive: true });
stage.addEventListener('lostpointercapture', event => {
  touchPointers.delete(event.pointerId);
  if (gesture?.id === event.pointerId) gesture = null;
});
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) {
    runningAnimations.forEach(animation => animation.finish());
    hotspotLabelAnimation?.finish();
  }
  syncRotations();
});
mobileLayout.addEventListener('change', () => {
  hideIngredients();
  updateIngredientMode();
  plateHovered = false;
  syncRotations();
  loadNeighbors();
  if (mobileLayout.matches) {
    const item = buttons[activeIndex].parentElement;
    list.scrollTo({ left: item.offsetLeft - (list.clientWidth - item.clientWidth) / 2, behavior: 'instant' });
  }
});
desktopPointer.addEventListener('change', () => { hideIngredients(true); plateHovered = false; updateIngredientMode(); syncRotations(); });
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('page-hidden', document.hidden);
  syncRotations();
});
window.addEventListener('pageshow', syncRotations);

// Native dialog supplies Escape dismissal, focus trapping, and focus return.
// Menu gestures are ignored while contact is open; plate motion stays independent.
const contactDialog = document.querySelector('#contact-dialog');
document.querySelector('#contact-open').addEventListener('click', () => { hideIngredients(); contactDialog.showModal(); });
document.querySelector('#contact-close').addEventListener('click', () => contactDialog.close());
contactDialog.addEventListener('click', event => {
  const rect = contactDialog.getBoundingClientRect();
  if (event.target === contactDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) contactDialog.close();
});
loadDish(0).then(loadNeighbors).catch(() => { status.textContent = 'The Chicken Biryani image could not be loaded.'; });
