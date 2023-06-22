import "./lib/babylon.js";
import "./lib/babylon.loaders.min.js";
import "./lib/babylon.gui.min.js";
import dat from "./lib/dat.gui.module.js";

let button = null;

const createScene = function () {
    // Creates a basic Babylon Scene object
    const scene = new BABYLON.Scene(engine);

    // Create a Camera
    // Parameters: name, alpha, beta, radius, target position, scene
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 3, Math.PI / 2.5, 2, new BABYLON.Vector3(0, 0, 0))
    camera.minZ = 0.01;
    camera.wheelDeltaPercentage = 0.1;
    camera.lowerRadiusLimit = 0.3;
    camera.upperRadiusLimit = 3;
    camera.attachControl(canvas, true)

    // Creates a light, aiming 0,1,0 - to the sky
    const light = new BABYLON.HemisphericLight("light",
        new BABYLON.Vector3(0, 1, 0), scene);
    // Dim the light a small amount - 0 to 1
    light.intensity = 0.7;

    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI");
    button = BABYLON.GUI.Button.CreateSimpleButton("but1", "No Structure Selected");
    button.top = "40%";
    button.width = "300px";
    button.height = "40px";
    button.color = "white";
    advancedTexture.addControl(button);


    scene.onPointerObservable.add(function (evt) {
        switch (evt.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                // disable picking to prevent selection of meshes (no laggy dragging)
                scene.skipPointerMovePicking = true;
                break;

            case BABYLON.PointerEventTypes.POINTERUP:
                // re-enable picking after a short delay
                setTimeout(function () {
                    scene.skipPointerMovePicking = false;
                }, 250);
                break;

            case BABYLON.PointerEventTypes.POINTERTAP:
                // clear selection if no mesh was hit
                if (!evt.pickInfo.hit) {
                    for (const mesh of scene.meshes.slice(2, scene.meshes.length)) {
                        mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                    }
                    button.textBlock.text = "No Structure Selected";
                }
                break;
        }
    });

    return scene;
};

const canvas = document.getElementById("renderCanvas");
const engine = await BABYLON.EngineFactory.CreateAsync(canvas);

const scene = createScene();
// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();
});
// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});

const gui = new dat.GUI();
gui.add({ reset: function () { window.location.reload(); } }, 'reset').name('Reset Scene');
// model selector
const models = ['full', 'half']
gui.add({ model: 'full' }, 'model', models).name('Model').listen().onChange(val => {
    // remove old model
    scene.meshes.slice(1, scene.meshes.length).forEach(mesh => mesh.dispose());
    console.log(Array.from(scene.meshes));
    // load new model
    loadModel(val);
})
// load initial model
loadModel('full');

function loadModel(model) {
    BABYLON.SceneLoader.Append("./", model + ".glb", scene, function (scene) {
        for (const mesh of scene.meshes.filter(mesh => !['Envelope', '__root__'].includes(mesh.name))) {
            mesh.actionManager = new BABYLON.ActionManager(scene);
            mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
                mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
                button.textBlock.text = mesh.name;
                for (const otherMesh of scene.meshes.slice(2, scene.meshes.length)) {
                    if (otherMesh.name != mesh.name) {
                        otherMesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                    }
                }
            }));
        }
    });
}