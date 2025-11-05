import 'package:flutter/material.dart';

import '../../utils/custom_colors.dart';

/// TextField customizado com estilo padrão do projeto
/// Usado em formulários de autenticação
class CustomTextField extends StatelessWidget {
  const CustomTextField({
    super.key,
    required this.controller,
    required this.hintText,
    this.obscureText = false,
    this.isPassword = false,
    this.onToggleVisibility,
    this.onChanged,
    this.onSubmitted,
    this.textInputAction,
    this.autofocus = false,
    this.enabled = true,
  });

  final TextEditingController controller;
  final String hintText;
  final bool obscureText;
  final bool isPassword;
  final VoidCallback? onToggleVisibility;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextInputAction? textInputAction;
  final bool autofocus;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: CustomColors.fieldBackground,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: CustomColors.fieldBorder,
          width: 2,
        ),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        enabled: enabled,
        autofocus: autofocus,
        onChanged: onChanged,
        onSubmitted: onSubmitted,
        textInputAction: textInputAction,
        style: const TextStyle(
          fontFamily: 'Zany',
          color: CustomColors.fieldText,
          fontSize: 16,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: const TextStyle(
            fontFamily: 'Zany',
            color: CustomColors.fieldText,
            fontSize: 14,
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          border: InputBorder.none,
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(
                    obscureText ? Icons.visibility_off : Icons.visibility,
                    color: CustomColors.fieldText.withOpacity(0.7),
                    size: 20,
                  ),
                  onPressed: onToggleVisibility,
                )
              : null,
        ),
        cursorColor: CustomColors.fieldText,
      ),
    );
  }
}
