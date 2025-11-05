import 'package:flutter/material.dart';

import '../../utils/custom_colors.dart';

/// Dialog customizado reutilizável com estilo do projeto
class CustomDialog extends StatelessWidget {
  const CustomDialog({
    super.key,
    this.title,
    required this.content,
    this.actions,
    this.width,
    this.showCloseButton = true,
  });

  final String? title;
  final Widget content;
  final List<Widget>? actions;
  final double? width;
  final bool showCloseButton;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        width: width ?? 400,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: CustomColors.panelBackground,
          border: Border.all(
            color: CustomColors.panelBorder,
            width: 4,
          ),
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.5),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Cabeçalho com título e botão de fechar
            if (title != null || showCloseButton)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (title != null)
                    Expanded(
                      child: Text(
                        title!,
                        style: const TextStyle(
                          fontFamily: 'Zany',
                          fontSize: 20,
                          color: CustomColors.fieldBorder,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  if (showCloseButton)
                    IconButton(
                      icon: const Icon(
                        Icons.close,
                        color: CustomColors.fieldBorder,
                      ),
                      onPressed: () => Navigator.of(context).pop(),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                ],
              ),

            // Espaçamento após título
            if (title != null || showCloseButton)
              const SizedBox(height: 16),

            // Conteúdo
            content,

            // Ações (botões)
            if (actions != null && actions!.isNotEmpty) ...[
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: actions!,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Dialog simples de confirmação
class ConfirmDialog extends StatelessWidget {
  const ConfirmDialog({
    super.key,
    this.title = 'Confirmar',
    required this.message,
    this.confirmText = 'Confirmar',
    this.cancelText = 'Cancelar',
    this.onConfirm,
  });

  final String title;
  final String message;
  final String confirmText;
  final String cancelText;
  final VoidCallback? onConfirm;

  @override
  Widget build(BuildContext context) {
    return CustomDialog(
      title: title,
      content: Text(
        message,
        style: const TextStyle(
          fontFamily: 'Zany',
          fontSize: 14,
          color: CustomColors.fieldBorder,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(
            cancelText,
            style: const TextStyle(
              fontFamily: 'Zany',
              color: CustomColors.fieldBorder,
            ),
          ),
        ),
        const SizedBox(width: 8),
        ElevatedButton(
          onPressed: () {
            onConfirm?.call();
            Navigator.of(context).pop(true);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: CustomColors.buttonGreenMedium,
            foregroundColor: CustomColors.textPrimary,
          ),
          child: Text(
            confirmText,
            style: const TextStyle(
              fontFamily: 'Zany',
            ),
          ),
        ),
      ],
    );
  }
}
