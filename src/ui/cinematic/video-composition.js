export function createVideoComposition(cinematicManager, options) {
    const { fps, width, height } = options;
    const duration = cinematicManager.timeline.duration;
    const durationInFrames = Math.ceil(duration * fps);

    return {
        cinematicManager,
        fps,
        width,
        height,
        duration,
        durationInFrames
    };
}

export function getCinematicFrame(composition, frame) {
    const { cinematicManager, fps, durationInFrames } = composition;
    const time = (frame / fps);
    const progress = frame / durationInFrames;

    // Get camera state at this time
    const cameraKeyframes = cinematicManager.timeline.keyframes
        .filter(k => k.type === 'camera')
        .sort((a, b) => a.time - b.time);

    let cameraState = null;

    if (cinematicManager.cameraMode === 'simple' && cinematicManager.simpleCameraConfig) {
        cameraState = getSimpleCameraState(cinematicManager, time, progress);
    } else {
        cameraState = getAdvancedCameraState(cameraKeyframes, time);
    }

    // Get environment state at this time
    const envState = getEnvironmentState(cinematicManager.timeline, time);

    return {
        time,
        frame,
        progress,
        cameraState,
        envState
    };
}

function getSimpleCameraState(cinematicManager, time, progress) {
    const config = cinematicManager.simpleCameraConfig;

    if (config.type === 'orbit') {
        const center = config.params.center;
        const d = config.params.distance;
        const elev = (config.params.angleDeg * Math.PI) / 180;
        const az = (config.params.startAzimuth ?? 0) + progress * Math.PI * 2;
        const hor = Math.cos(elev) * d;
        return {
            position: {
                x: center.x + Math.sin(az) * hor,
                y: Math.sin(elev) * d,
                z: center.z + Math.cos(az) * hor
            },
            lookAt: { x: center.x, y: 0, z: center.z }
        };
    } else if (config.type === 'flyLine') {
        const name = config.params.easing || 'easeInOutCubic';
        const eased = name === 'linear' ? progress : easeInOutCubic(progress);
        return {
            position: lerpVector3(config.params.startPosition, config.params.endPosition, eased),
            rotation: {
                x: lerp(config.params.startRotation.x, config.params.endRotation.x, eased),
                y: lerp(config.params.startRotation.y, config.params.endRotation.y, eased)
            }
        };
    }

    return null;
}

function getAdvancedCameraState(keyframes, time) {
    if (keyframes.length === 0) return null;

    let prevKeyframe = null;
    let nextKeyframe = null;

    for (let i = 0; i < keyframes.length; i++) {
        if (keyframes[i].time <= time) {
            prevKeyframe = keyframes[i];
        }
        if (keyframes[i].time > time && !nextKeyframe) {
            nextKeyframe = keyframes[i];
            break;
        }
    }

    if (!prevKeyframe && nextKeyframe) {
        return nextKeyframe.data;
    } else if (prevKeyframe && !nextKeyframe) {
        return prevKeyframe.data;
    } else if (prevKeyframe && nextKeyframe) {
        const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
        const easedT = (prevKeyframe.data?.easing === 'linear') ? t : easeInOutCubic(t);

        return {
            position: lerpVector3(prevKeyframe.data.position, nextKeyframe.data.position, easedT),
            rotation: {
                x: lerp(prevKeyframe.data.rotation.x, nextKeyframe.data.rotation.x, easedT),
                y: lerp(prevKeyframe.data.rotation.y, nextKeyframe.data.rotation.y, easedT)
            }
        };
    }

    return prevKeyframe ? prevKeyframe.data : null;
}

function getEnvironmentState(timeline, time) {
    const envKeyframes = timeline.keyframes
        .filter(k => k.type === 'environment')
        .sort((a, b) => a.time - b.time);

    if (envKeyframes.length === 0) {
        return {
            ambientLight: 0.4,
            directionalLight: 0.8,
            fogDensity: 0
        };
    }

    let prevKeyframe = null;
    let nextKeyframe = null;

    for (let i = 0; i < envKeyframes.length; i++) {
        if (envKeyframes[i].time <= time) {
            prevKeyframe = envKeyframes[i];
        }
        if (envKeyframes[i].time > time && !nextKeyframe) {
            nextKeyframe = envKeyframes[i];
            break;
        }
    }

    if (!prevKeyframe && nextKeyframe) {
        return nextKeyframe.data;
    } else if (prevKeyframe && !nextKeyframe) {
        return prevKeyframe.data;
    } else if (prevKeyframe && nextKeyframe) {
        const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);

        return {
            ambientLight: lerp(prevKeyframe.data.ambientLight, nextKeyframe.data.ambientLight, t),
            directionalLight: lerp(prevKeyframe.data.directionalLight, nextKeyframe.data.directionalLight, t),
            fogDensity: lerp(prevKeyframe.data.fogDensity, nextKeyframe.data.fogDensity, t)
        };
    }

    return prevKeyframe ? prevKeyframe.data : {
        ambientLight: 0.4,
        directionalLight: 0.8,
        fogDensity: 0
    };
}

function lerpVector3(a, b, t) {
    return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        z: lerp(a.z, b.z, t)
    };
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}