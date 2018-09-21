<?php
/**
 * Formski for Craft CMS
 *
 * @link      https://ethercreative.co.uk
 * @copyright Copyright (c) 2018 Ether Creative
 */

namespace ether\formski\migrations;

use craft\db\Migration;

/**
 * Class Install
 *
 * @author  Ether Creative
 * @package ether\formski\migrations
 */
class Install extends Migration
{

	// Constants
	// =========================================================================

	const FORMS_TABLE_NAME = '{{%formski_forms}}';
	const SUBMISSIONS_TABLE_NAME = '{{%formski_submissions}}';

	// Methods
	// =========================================================================

	// Methods: Public
	// -------------------------------------------------------------------------

	public function safeUp ()
	{
		$this->_forms();
		$this->_submissions();
	}

	public function safeDown ()
	{
		// Drop Forms Table
		$this->dropTableIfExists(self::FORMS_TABLE_NAME);

		// Drop Submissions Table
		$this->dropTableIfExists(self::SUBMISSIONS_TABLE_NAME);

		// Drop form content tables
		foreach (\Craft::$app->db->schema->tableNames as $tableName)
			if (strpos($tableName, 'formski_form_') !== false)
				$this->dropTableIfExists($tableName);
	}

	// Methods: Private
	// -------------------------------------------------------------------------

	private function _forms ()
	{
		if ($this->db->tableExists(self::FORMS_TABLE_NAME))
			return;

		$this->createTable(self::FORMS_TABLE_NAME, [
			'id'     => $this->primaryKey(),
			'handle' => $this->char(5)->notNull(),

			'authorId' => $this->integer()->notNull(),

			'title'          => $this->char(255)->notNull(),
			'slug'           => $this->char(255)->notNull(),
			'titleFormat'    => $this->string()->notNull(),
			'fieldLayout'    => $this->json()->null(),
			'fieldSettings'  => $this->json()->null(),
			'dateDue'        => $this->dateTime()->null(),
			'daysToComplete' => $this->integer()->null(),

			'dateCreated' => $this->dateTime()->notNull(),
			'dateUpdated' => $this->dateTime()->notNull(),
			'uid'         => $this->uid(),
		]);

		$this->addForeignKey(
			$this->db->getForeignKeyName(self::FORMS_TABLE_NAME, 'id'),
			self::FORMS_TABLE_NAME,
			'id',
			'{{%elements}}',
			'id',
			'CASCADE',
			null
		);
	}

	private function _submissions ()
	{
		if ($this->db->tableExists(self::SUBMISSIONS_TABLE_NAME))
			return;

		$this->createTable(self::SUBMISSIONS_TABLE_NAME, [
			'id'    => $this->primaryKey(),

			'formId' => $this->integer()->notNull(),
			'title' => $this->string()->notNull(),
			'ipAddress' => $this->string()->null(),
			'userAgent' => $this->string()->null(),

			'dateCreated' => $this->dateTime()->notNull(),
			'dateUpdated' => $this->dateTime()->notNull(),
			'uid'         => $this->uid(),
		]);

		$this->addForeignKey(
			$this->db->getForeignKeyName(self::SUBMISSIONS_TABLE_NAME, 'id'),
			self::SUBMISSIONS_TABLE_NAME,
			'id',
			'{{%elements}}',
			'id',
			'CASCADE',
			null
		);

		$this->addForeignKey(
			$this->db->getForeignKeyName(self::SUBMISSIONS_TABLE_NAME, 'formId'),
			self::SUBMISSIONS_TABLE_NAME,
			'id',
			self::FORMS_TABLE_NAME,
			'id',
			'CASCADE',
			null
		);
	}

}