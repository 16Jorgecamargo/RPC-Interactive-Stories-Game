import 'package:flutter/material.dart';

import '../../../shared/utils/custom_colors.dart';

/// Card de formulário reutilizável para telas de autenticação
/// Fornece o container base com estilo padrão
class AuthFormCard extends StatelessWidget {
  const AuthFormCard({
    super.key,
    required this.children,
    this.topMargin = 80,
    this.topPadding = 120,
  });

  final List<Widget> children;
  final double topMargin;
  final double topPadding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(top: topMargin),
      padding: EdgeInsets.only(
        top: topPadding,
        left: 32,
        right: 32,
        bottom: 32,
      ),
      decoration: BoxDecoration(
        color: CustomColors.panelBackground,
        border: Border.all(
          color: CustomColors.panelBorder,
          width: 4,
        ),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: children,
      ),
    );
  }
}
