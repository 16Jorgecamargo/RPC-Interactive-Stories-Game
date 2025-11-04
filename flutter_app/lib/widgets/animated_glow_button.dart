import 'package:flutter/material.dart';

import '../utils/custom_colors.dart';

class AnimatedGlowButton extends StatefulWidget {
  const AnimatedGlowButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isPrimary = true,
    this.isLoading = false,
  });

  final String text;
  final VoidCallback? onPressed;
  final bool isPrimary;
  final bool isLoading;

  @override
  State<AnimatedGlowButton> createState() => _AnimatedGlowButtonState();
}

class _AnimatedGlowButtonState extends State<AnimatedGlowButton>
    with SingleTickerProviderStateMixin {
  bool _isHovering = false;
  bool _isPressed = false;

  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 250),
    lowerBound: 0.0,
    upperBound: 1.0,
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleEnter(bool hovering) {
    if (!mounted) return;
    setState(() => _isHovering = hovering);
    _animate();
  }

  void _handlePress(bool pressed) {
    if (!mounted) return;
    setState(() => _isPressed = pressed);
    _animate();
  }

  void _animate() {
    if (_isHovering || _isPressed) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null && !widget.isLoading;
    final gradientColors = widget.isPrimary
        ? [
            CustomColors.buttonGreenLight,
            CustomColors.buttonGreenMedium,
            CustomColors.buttonGreenDark,
          ]
        : [
            CustomColors.buttonBrownLight,
            CustomColors.buttonBrownMedium,
            CustomColors.buttonBrownDark,
          ];

    return MouseRegion(
      onEnter: (_) => _handleEnter(true),
      onExit: (_) => _handleEnter(false),
      cursor: enabled ? SystemMouseCursors.click : SystemMouseCursors.basic,
      child: GestureDetector(
        onTapDown: enabled ? (_) => _handlePress(true) : null,
        onTapUp: enabled ? (_) => _handlePress(false) : null,
        onTapCancel: enabled ? () => _handlePress(false) : null,
        onTap: enabled ? widget.onPressed : null,
        child: SizedBox(
          width: double.infinity,
          height: 54,
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              final scale = 1.0 + (_controller.value * 0.04);
              final shadowOpacity = _controller.value * 0.6;

              return Transform.scale(
                scale: enabled ? scale : 1.0,
                alignment: Alignment.center,
                child: Container(
                  width: double.infinity,
                  height: 54,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: gradientColors,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: CustomColors.fieldBorder,
                      width: 3,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (widget.isPrimary
                                ? CustomColors.buttonGreenLight
                                : CustomColors.buttonBrownLight)
                            .withOpacity(enabled ? shadowOpacity : 0),
                        blurRadius: 24,
                        spreadRadius: 4,
                        offset: const Offset(0, 6),
                      ),
                      BoxShadow(
                        color: Colors.black.withOpacity(0.35),
                        blurRadius: 6,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Center(
                    child: widget.isLoading
                        ? const SizedBox(
                            width: 26,
                            height: 26,
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(
                                CustomColors.fieldText,
                              ),
                              strokeWidth: 3,
                            ),
                          )
                        : Text(
                            widget.text,
                            style: const TextStyle(
                              fontFamily: 'Zany',
                              fontSize: 18,
                              color: CustomColors.fieldText,
                              letterSpacing: 0.8,
                              height: 1.0,
                              shadows: [
                                Shadow(
                                  color: Colors.black38,
                                  offset: Offset(1, 1),
                                  blurRadius: 2,
                                ),
                              ],
                            ),
                          ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
