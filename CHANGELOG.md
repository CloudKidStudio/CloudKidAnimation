##2.0.0 (2014-03-31)

- Changed how animator controls playback to be time based, like PixiAnimator. This means that the play() parameters have changed from (instance, event, onComplete, onCompleteParams, dropFrames, frameOffset, doCancelledCallback) to (instance, event, onComplete, onCompleteParams, startTime, speed, soundData, doCancelledCallback). Also, many properties on AnimatorTimeline have changed.
- Added built in audio syncing with either cloudkid.Sound or cloudkid.Audio. Set Animator.audioLib in order to use it, then pass an {alias:"myAlias", start:0.2} object for the soundData parameter for play().
- Split build into CreateJS and Pixi versions, and moved PixiAnimator in to be the sole class in the Pixi build.
- Added instanceHasAnimation() to both animators, to detect if a MovieClip or Spine animation actually has an animation. This is so you can avoid endless recursive callbacks on nonexistant animations.