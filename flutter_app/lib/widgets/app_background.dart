import 'package:flutter/material.dart';

class AppBackground extends StatelessWidget {
  const AppBackground({
    super.key,
    required this.imageAsset,
    required this.child,
    this.alignment = Alignment.center,
    this.overlayGradient,
    this.overlayColor,
  });

  final String imageAsset;
  final Widget child;
  final Alignment alignment;
  final Gradient? overlayGradient;
  final Color? overlayColor;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              image: DecorationImage(
                image: AssetImage(imageAsset),
                fit: BoxFit.cover,
                alignment: alignment,
              ),
            ),
          ),
        ),
        if (overlayColor != null || overlayGradient != null)
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: overlayColor,
                gradient: overlayGradient,
              ),
            ),
          ),
        child,
      ],
    );
  }
}
